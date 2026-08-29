const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const pool = require("../db");
const { analyzeTransaction } = require("../agents/recoveryAgent");
const { validateRecoveryAction } = require("../services/guardrails/guardrailEngine");
const {
    analyzeAndRecordTransaction,
    runBatchAnalysis,
    getTransactionsList,
    getRecoveryOpportunities,
    getRecoverySummary,
    getAuditLogs,
    getRecoveryActions,
    reviewRecoveryAction,
    getAnalyticsSummary,
    getPaymentMethodAnalytics,
    getFailureReasonAnalytics
} = require("../services/recoveryEngine");

const BASE_URL = "http://localhost:5000/api/recovery";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const bugsFound = [];

function assert(condition, testName, details = "") {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  ✓ [PASS] ${testName}`);
    } else {
        failedTests++;
        const bugMsg = `FAIL: ${testName} ${details ? `(${details})` : ""}`;
        bugsFound.push(bugMsg);
        console.error(`  ✗ [FAIL] ${testName} ${details ? `(${details})` : ""}`);
    }
}

async function runAttackSuite() {
    console.log("================================================================================");
    console.log(" 🛡️  RECOVERAI RECRUITER-LEVEL ATTACK & STRESS TEST SUITE");
    console.log("================================================================================\n");

    try {
        // =========================================================================
        // CATEGORY 1: TRANSACTION SAFETY & IDEMPOTENCY
        // =========================================================================
        console.log("--------------------------------------------------------------------------------");
        console.log("CATEGORY 1: Transaction Safety, Boundary Validation & Idempotency");
        console.log("--------------------------------------------------------------------------------");

        // 1.1 Non-existent transaction ID
        const nonExistentRes = await fetch(`${BASE_URL}/analyze/RP999999`);
        assert(nonExistentRes.status === 404, "Non-existent transaction ID (RP999999) returns 404 Not Found");
        const nonExistentData = await nonExistentRes.json();
        assert(nonExistentData.success === false, "Non-existent transaction response has success=false");

        // 1.2 Malicious/special characters in transaction ID
        const sqlInjectionIdRes = await fetch(`${BASE_URL}/analyze/' OR '1'='1`);
        assert(sqlInjectionIdRes.status === 404, "SQL Injection attempt in transactionId returns 404 Not Found without crashing");

        const specialCharsRes = await fetch(`${BASE_URL}/analyze/!@#$%^&*()`);
        assert(specialCharsRes.status === 404, "Special characters transaction ID returns 404 without crashing");

        // 1.3 Successful transaction safety
        const successRes = await fetch(`${BASE_URL}/analyze/RP000001`);
        assert(successRes.status === 200, "Analyze endpoint for SUCCESS transaction (RP000001) returns 200 OK");
        const successData = await successRes.json();
        assert(successData.is_eligible === false, "SUCCESS transaction is_eligible is false");
        assert(successData.action_id === null, "SUCCESS transaction action_id is null");
        assert(successData.agent_decision.decision === "NO_RECOVERY_NEEDED", "Agent decision is NO_RECOVERY_NEEDED for settled payment");
        assert(successData.guardrail_decision.allowed === false, "Guardrail allowed is false for settled payment");
        assert(successData.guardrail_decision.escalationRequired === false, "Guardrail escalationRequired is false for settled payment");

        // Verify DB integrity for SUCCESS transaction
        const dbSuccessAction = await pool.query("SELECT * FROM recovery_actions WHERE transaction_id = 'RP000001'");
        assert(dbSuccessAction.rows.length === 0, "Zero recovery_actions in database for RP000001");

        // 1.4 Failed transaction eligibility & idempotency
        const failedTxId = "RP000003";
        const firstAnalyzeRes = await fetch(`${BASE_URL}/analyze/${failedTxId}`);
        assert(firstAnalyzeRes.status === 200, `Analyze FAILED transaction (${failedTxId}) returns 200 OK`);
        const firstData = await firstAnalyzeRes.json();
        assert(firstData.is_eligible === true, "FAILED transaction is_eligible is true");
        assert(firstData.action_id !== null && typeof firstData.action_id === "number", "FAILED transaction has numeric action_id");

        // Subsequent call must be idempotent
        const secondAnalyzeRes = await fetch(`${BASE_URL}/analyze/${failedTxId}`);
        const secondData = await secondAnalyzeRes.json();
        assert(secondData.is_new === false, "Subsequent analyze call marks is_new = false (idempotent)");
        assert(secondData.action_id === firstData.action_id, "Subsequent analyze call reuses exact same action_id");

        const duplicateCheck = await pool.query("SELECT COUNT(*) AS count FROM recovery_actions WHERE transaction_id = $1", [failedTxId]);
        assert(parseInt(duplicateCheck.rows[0].count, 10) === 1, `Exactly 1 recovery_action in database for ${failedTxId}`);


        // =========================================================================
        // CATEGORY 2: BATCH ANALYSIS STRESS & PURITY
        // =========================================================================
        console.log("\n--------------------------------------------------------------------------------");
        console.log("CATEGORY 2: Batch Analysis Ingestion Purity & Multi-Run Idempotency");
        console.log("--------------------------------------------------------------------------------");

        // 2.1 Malformed batch body
        const malformedBatchRes = await fetch(`${BASE_URL}/batch-analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ limit: "invalid_string" })
        });
        assert(malformedBatchRes.status === 200, "Batch analysis gracefully handles invalid limit parameter without crashing");

        // 2.2 First batch execution
        const batch1Res = await fetch(`${BASE_URL}/batch-analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });
        assert(batch1Res.status === 200, "Batch analysis execution returns 200 OK");
        const batch1Data = await batch1Res.json();
        assert(batch1Data.summary.total_failed_transactions === 184, "Batch analysis operates strictly on 184 failed transactions");
        assert(batch1Data.summary.total_analyzed === 184, "Total analyzed matches total failed transactions");

        // 2.3 Second batch execution (must not create duplicate actions)
        const batch2Res = await fetch(`${BASE_URL}/batch-analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });
        const batch2Data = await batch2Res.json();
        assert(batch2Data.summary.newly_analyzed === 0, "Second batch run newly_analyzed is 0");
        assert(batch2Data.summary.skipped === 184, "Second batch run skipped all 184 already analyzed transactions");
        assert(batch2Data.summary.total_analyzed === 184, "Second batch run total_analyzed remains 184");

        // 2.4 Verify no SUCCESS transactions were touched
        const successInActions = await pool.query(`
            SELECT COUNT(*) AS count
            FROM recovery_actions ra
            JOIN transactions t ON ra.transaction_id = t.transaction_id
            WHERE t.status = 'SUCCESS'
        `);
        assert(parseInt(successInActions.rows[0].count, 10) === 0, "Zero SUCCESS transactions in recovery_actions table after batch runs");


        // =========================================================================
        // CATEGORY 3: HUMAN REVIEW STATE MACHINE & ADVERSARIAL INPUTS
        // =========================================================================
        console.log("\n--------------------------------------------------------------------------------");
        console.log("CATEGORY 3: Human Review State Machine & Adversarial Attack Vectors");
        console.log("--------------------------------------------------------------------------------");

        // 3.1 Non-existent action ID
        const nonExistentActionRes = await fetch(`${BASE_URL}/human-review/999999`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision: "APPROVE", reviewer: "Admin", reason: "Testing" })
        });
        assert(nonExistentActionRes.status === 404, "Review non-existent action ID (999999) returns 404 Not Found");

        // 3.2 Negative / Invalid action ID format
        const negativeActionRes = await fetch(`${BASE_URL}/human-review/-5`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision: "APPROVE", reviewer: "Admin", reason: "Testing" })
        });
        assert(negativeActionRes.status === 400, "Review negative action ID (-5) returns 400 Bad Request");

        const alphaActionRes = await fetch(`${BASE_URL}/human-review/notanumber`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision: "APPROVE", reviewer: "Admin", reason: "Testing" })
        });
        assert(alphaActionRes.status === 400, "Review alphanumeric action ID returns 400 Bad Request");

        // 3.3 Missing required fields
        const missingDecisionRes = await fetch(`${BASE_URL}/human-review/1`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reviewer: "Admin", reason: "Testing" })
        });
        assert(missingDecisionRes.status === 400, "Missing 'decision' field returns 400 Bad Request");

        const missingReviewerRes = await fetch(`${BASE_URL}/human-review/1`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision: "APPROVE", reviewer: "   ", reason: "Testing" })
        });
        assert(missingReviewerRes.status === 400, "Whitespace-only 'reviewer' returns 400 Bad Request");

        const missingReasonRes = await fetch(`${BASE_URL}/human-review/1`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision: "APPROVE", reviewer: "Admin", reason: "   " })
        });
        assert(missingReasonRes.status === 400, "Whitespace-only 'reason' returns 400 Bad Request");

        // 3.4 Invalid decision value
        const invalidDecisionRes = await fetch(`${BASE_URL}/human-review/1`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision: "MAYBE", reviewer: "Admin", reason: "Testing" })
        });
        assert(invalidDecisionRes.status === 400, "Invalid decision 'MAYBE' returns 400 Bad Request");

        // 3.5 Find a valid pending action to test APPROVE
        const pendingActionsRes = await fetch(`${BASE_URL}/actions?requires_human=true&limit=5`);
        const pendingActionsData = await pendingActionsRes.json();
        assert(pendingActionsData.data.length > 0, "Found pending action requiring human review");

        const targetApproveAction = pendingActionsData.data[0];
        const approveRes = await fetch(`${BASE_URL}/human-review/${targetApproveAction.action_id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                decision: "APPROVE",
                reviewer: "RiskOfficer_Dave",
                reason: "Authorized high-value payment recovery attempt"
            })
        });
        assert(approveRes.status === 200, `Approve action #${targetApproveAction.action_id} returns 200 OK`);
        const approveData = await approveRes.json();
        assert(approveData.action.status === "APPROVED", "Approved action status is updated to APPROVED");
        assert(approveData.action.requires_human === false, "Approved action requires_human is set to false");
        assert(approveData.action.result === "APPROVED_BY_HUMAN", "Approved action result is set to APPROVED_BY_HUMAN");
        assert(approveData.audit_log.actor === "RiskOfficer_Dave", "Audit log records reviewer name RiskOfficer_Dave");
        assert(approveData.audit_log.outcome === "ACTION_APPROVED", "Audit log outcome is ACTION_APPROVED");

        // 3.6 Test Re-Reviewing an already completed action (Must Fail)
        const reApproveRes = await fetch(`${BASE_URL}/human-review/${targetApproveAction.action_id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                decision: "APPROVE",
                reviewer: "Another_Officer",
                reason: "Double approve attempt"
            })
        });
        assert(reApproveRes.status === 400, "Attempt to re-review already completed action returns 400 Bad Request");

        // 3.7 Test REJECT on another pending action
        const remainingPending = await fetch(`${BASE_URL}/actions?requires_human=true&limit=5`);
        const remainingData = await remainingPending.json();
        if (remainingData.data.length > 0) {
            const targetRejectAction = remainingData.data[0];
            const rejectRes = await fetch(`${BASE_URL}/human-review/${targetRejectAction.action_id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    decision: "REJECT",
                    reviewer: "FraudSpecialist_Sara",
                    reason: "Suspicious pattern confirmed by security team"
                })
            });
            assert(rejectRes.status === 200, `Reject action #${targetRejectAction.action_id} returns 200 OK`);
            const rejectData = await rejectRes.json();
            assert(rejectData.action.status === "REJECTED", "Rejected action status is updated to REJECTED");
            assert(rejectData.action.requires_human === false, "Rejected action requires_human is set to false");
            assert(rejectData.action.result === "REJECTED_BY_HUMAN", "Rejected action result is set to REJECTED_BY_HUMAN");
            assert(rejectData.audit_log.outcome === "ACTION_REJECTED", "Audit log outcome is ACTION_REJECTED");
        }


        // =========================================================================
        // CATEGORY 4: 5 DETERMINISTIC GUARDRAIL VALIDATION
        // =========================================================================
        console.log("\n--------------------------------------------------------------------------------");
        console.log("CATEGORY 4: 5 Deterministic Guardrail Safety Checks");
        console.log("--------------------------------------------------------------------------------");

        // Guardrail 1: Transaction must be FAILED
        const g1 = validateRecoveryAction({ status: "SUCCESS", retry_count: 0, fraud_score: 0.1, amount: 1000 }, { decision: "RETRY_PAYMENT", confidence: 0.9 });
        assert(g1.allowed === false && g1.finalAction === "NO_RECOVERY_NEEDED" && g1.escalationRequired === false, "Guardrail 1: Succeeded transaction cannot be recovered and is not escalated");

        // Guardrail 2: Max retry limit (>= 2)
        const g2 = validateRecoveryAction({ status: "FAILED", retry_count: 2, fraud_score: 0.1, amount: 1000 }, { decision: "RETRY_PAYMENT", confidence: 0.9 });
        assert(g2.allowed === false && g2.finalAction === "DO_NOT_RECOVER", "Guardrail 2: Retry count >= 2 blocks automatic retries");

        // Guardrail 3: Fraud protection (>= 0.70)
        const g3 = validateRecoveryAction({ status: "FAILED", retry_count: 0, fraud_score: 0.75, amount: 1000 }, { decision: "RETRY_PAYMENT", confidence: 0.9 });
        assert(g3.allowed === false && g3.finalAction === "HUMAN_REVIEW" && g3.escalationRequired === true, "Guardrail 3: High fraud score (0.75) escalates to HUMAN_REVIEW");

        // Guardrail 4: High-value transaction (> 50,000)
        const g4 = validateRecoveryAction({ status: "FAILED", retry_count: 0, fraud_score: 0.1, amount: 75000 }, { decision: "RETRY_PAYMENT", confidence: 0.9 });
        assert(g4.allowed === false && g4.finalAction === "HUMAN_REVIEW" && g4.escalationRequired === true, "Guardrail 4: Transaction > 50k escalates to HUMAN_REVIEW");

        // Guardrail 5: Low confidence (< 0.75)
        const g5 = validateRecoveryAction({ status: "FAILED", retry_count: 0, fraud_score: 0.1, amount: 1000 }, { decision: "RETRY_PAYMENT", confidence: 0.60 });
        assert(g5.allowed === false && g5.finalAction === "HUMAN_REVIEW" && g5.escalationRequired === true, "Guardrail 5: Low confidence (0.60) escalates to HUMAN_REVIEW");


        // =========================================================================
        // CATEGORY 5: AUDIT TRAIL IMMUTABILITY & COMPLETENESS
        // =========================================================================
        console.log("\n--------------------------------------------------------------------------------");
        console.log("CATEGORY 5: Audit Trail Immutability & Event Tracing");
        console.log("--------------------------------------------------------------------------------");

        const auditTrailRes = await fetch(`${BASE_URL}/audit-logs?limit=50`);
        assert(auditTrailRes.status === 200, "Audit trail endpoint returns 200 OK");
        const auditTrailData = await auditTrailRes.json();
        assert(auditTrailData.total > 0, "Audit trail contains records");

        const hasAiAnalysisLogs = auditTrailData.data.some(l => l.event_type === "RECOVERY_ANALYSIS");
        assert(hasAiAnalysisLogs, "Audit trail contains RECOVERY_ANALYSIS event logs");

        const hasHumanReviewLogs = auditTrailData.data.some(l => l.event_type === "HUMAN_REVIEW");
        assert(hasHumanReviewLogs, "Audit trail contains HUMAN_REVIEW event logs");

        const sampleLog = auditTrailData.data[0];
        assert(typeof sampleLog.guardrails_checked === "object" && sampleLog.guardrails_checked !== null, "Audit log has structured guardrails_checked payload");
        assert(typeof sampleLog.reasoning === "string" && sampleLog.reasoning.length > 0, "Audit log contains explicit reasoning text");
        assert(typeof sampleLog.actor === "string" && sampleLog.actor.length > 0, "Audit log contains actor attribution");


        // =========================================================================
        // CATEGORY 6: API ROBUSTNESS & ADVERSARIAL QUERY INJECTIONS
        // =========================================================================
        console.log("\n--------------------------------------------------------------------------------");
        console.log("CATEGORY 6: API Robustness, Query Injections & Bounds Testing");
        console.log("--------------------------------------------------------------------------------");

        // 6.1 SQL Injection in sort_by
        const injectionSortRes = await fetch(`${BASE_URL}/transactions?sort_by=;DROP%20TABLE%20transactions;--`);
        assert(injectionSortRes.status === 200, "SQL Injection in sort_by handled gracefully (fallback to default sort)");
        const injectionSortData = await injectionSortRes.json();
        assert(injectionSortData.data.length > 0, "Data returned normally despite malicious sort_by");

        // 6.2 Out-of-bounds pagination
        const negativePageRes = await fetch(`${BASE_URL}/transactions?page=-10&limit=-5`);
        assert(negativePageRes.status === 200, "Negative page & limit normalized safely without 500 error");
        const negativePageData = await negativePageRes.json();
        assert(negativePageData.page === 1, "Negative page normalized to 1");

        const massivePageRes = await fetch(`${BASE_URL}/transactions?page=9999999&limit=10`);
        assert(massivePageRes.status === 200, "Out-of-bounds large page returns 200 OK with empty data array");
        const massivePageData = await massivePageRes.json();
        assert(massivePageData.data.length === 0, "Large page returned 0 rows cleanly");

        // 6.3 Special characters search
        const specialSearchRes = await fetch(`${BASE_URL}/transactions?search=%25%27%22%3C%3E%26`);
        assert(specialSearchRes.status === 200, "Special characters search returns 200 OK without database error");

        // 6.4 Invalid filter values
        const invalidFilterRes = await fetch(`${BASE_URL}/transactions?payment_method=BITCOIN&status=PENDING`);
        assert(invalidFilterRes.status === 200, "Non-existent filter values return 200 OK with 0 records");
        const invalidFilterData = await invalidFilterRes.json();
        assert(invalidFilterData.data.length === 0, "Filtered list has 0 matches");


        // =========================================================================
        // CATEGORY 7: DATA CONSISTENCY ACROSS ALL PLATFORM VIEWS
        // =========================================================================
        console.log("\n--------------------------------------------------------------------------------");
        console.log("CATEGORY 7: Enterprise Data Consistency Verification");
        console.log("--------------------------------------------------------------------------------");

        const summaryRes = await fetch(`${BASE_URL}/analytics/summary`);
        const summaryData = await summaryRes.json();
        const s = summaryData.summary;

        // DB ground truth counts
        const dbTotalTx = await pool.query("SELECT COUNT(*) AS count FROM transactions");
        const dbSuccessTx = await pool.query("SELECT COUNT(*) AS count FROM transactions WHERE status = 'SUCCESS'");
        const dbFailedTx = await pool.query("SELECT COUNT(*) AS count FROM transactions WHERE status = 'FAILED'");
        const dbActionsCount = await pool.query("SELECT COUNT(*) AS count FROM recovery_actions ra JOIN transactions t ON ra.transaction_id = t.transaction_id WHERE t.status = 'FAILED'");
        const dbOppsCount = await pool.query(`
            SELECT COUNT(*) AS count
            FROM transactions
            WHERE status = 'FAILED'
              AND recovery_probability >= 0.50
              AND retry_count < 2
              AND fraud_score < 0.70
        `);

        assert(s.total_transactions === parseInt(dbTotalTx.rows[0].count, 10), `Total transactions matches DB (${s.total_transactions} == 1000)`);
        assert(s.successful_transactions === parseInt(dbSuccessTx.rows[0].count, 10), `Successful transactions matches DB (${s.successful_transactions} == 816)`);
        assert(s.failed_transactions === parseInt(dbFailedTx.rows[0].count, 10), `Failed transactions matches DB (${s.failed_transactions} == 184)`);
        assert(s.total_analyzed_actions === parseInt(dbActionsCount.rows[0].count, 10), `Analyzed actions matches DB (${s.total_analyzed_actions} == 184)`);
        assert(s.recovery_opportunities === parseInt(dbOppsCount.rows[0].count, 10), `Recovery opportunities matches DB (${s.recovery_opportunities} == 83)`);

        // Check sum integrity
        assert(s.successful_transactions + s.failed_transactions === s.total_transactions, "Successful + Failed == Total Transactions");
        assert(s.approved_action_count + s.blocked_action_count === s.total_analyzed_actions, "Approved + Blocked/Rejected == Total Analyzed Actions");

    } catch (err) {
        console.error("Critical test execution failure:", err);
        failedTests++;
        bugsFound.push(`CRITICAL EXCEPTION: ${err.message}`);
    } finally {
        console.log("\n================================================================================");
        console.log(` 📊 STRESS & ATTACK TEST SUMMARY: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
        if (bugsFound.length > 0) {
            console.log("\n ❌ DEFECTS DISCOVERED:");
            bugsFound.forEach(b => console.log(`   - ${b}`));
        } else {
            console.log("\n 🏆 ZERO DEFECTS FOUND. All security, state machine, and consistency assertions passed!");
        }
        console.log("================================================================================\n");

        await pool.end();
        process.exit(failedTests === 0 ? 0 : 1);
    }
}

runAttackSuite();
