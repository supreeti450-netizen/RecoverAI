const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const pool = require("../db");
const app = require("../server");
const {
    analyzeAndRecordTransaction,
    executeRecoveryAction,
    reviewRecoveryAction,
    cleanupInvalidRecoveryRecords
} = require("../services/recoveryEngine");

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const bugs = [];

function assert(condition, testName, details = "") {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  ✅ PASS: ${testName}`);
    } else {
        failedTests++;
        const bugMsg = `FAIL: ${testName} ${details ? `(${details})` : ""}`;
        bugs.push(bugMsg);
        console.error(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ""}`);
    }
}

async function runRecoveryExecutionTests() {
    console.log("\n=======================================================");
    console.log(" RecoverAI Gateway Recovery Dispatch Simulation Tests");
    console.log("=======================================================\n");

    let testServer = null;
    let BASE_URL = process.env.API_BASE_URL || "";

    try {
        if (!BASE_URL) {
            testServer = await new Promise((resolve, reject) => {
                const s = app.listen(0, "127.0.0.1", () => resolve(s));
                s.on("error", reject);
            });
            const port = testServer.address().port;
            BASE_URL = `http://127.0.0.1:${port}/api/recovery`;
        }

        await cleanupInvalidRecoveryRecords(pool);

        // -------------------------------------------------------------
        // TEST 1: Non-existent Action ID
        // -------------------------------------------------------------
        console.log("🔹 1. Non-existent & Invalid Action ID Validation");
        const invalidIdRes = await fetch(`${BASE_URL}/execute/999999`, { method: "POST" });
        assert(invalidIdRes.status === 404, "Non-existent actionId (999999) returns 404 Not Found");
        const invalidIdData = await invalidIdRes.json();
        assert(invalidIdData.success === false, "Non-existent action returns success=false");
        assert(invalidIdData.error === "NOT_FOUND", "Error code is NOT_FOUND");

        const negativeIdRes = await fetch(`${BASE_URL}/execute/-1`, { method: "POST" });
        assert(negativeIdRes.status === 400, "Negative actionId returns 400 Bad Request");

        // -------------------------------------------------------------
        // TEST 2: Successful Automated Recovery Dispatch Execution
        // -------------------------------------------------------------
        console.log("\n🔹 2. Successful Execution of Approved Action & Capping");
        // Find a failed transaction that is safe to recover (low fraud, retries < 2, amount <= 50000, confidence >= 0.75)
        const safeTxRes = await pool.query(`
            SELECT * FROM transactions
            WHERE status = 'FAILED'
              AND amount <= 50000
              AND fraud_score < 0.70
              AND retry_count < 2
              AND recovery_probability >= 0.75
            ORDER BY transaction_id ASC
            LIMIT 1
        `);
        assert(safeTxRes.rows.length > 0, "Found safe failed transaction candidate in database");
        const safeTx = safeTxRes.rows[0];

        // Analyze and ensure action exists
        const analysis = await analyzeAndRecordTransaction(safeTx, pool);
        const actionId = analysis.actionId;
        assert(typeof actionId === "number" && actionId > 0, `Action created or retrieved for ${safeTx.transaction_id} (action_id: #${actionId})`);

        // Execute recovery dispatch via HTTP API
        const execRes = await fetch(`${BASE_URL}/execute/${actionId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dispatcher: "Test_Automated_Dispatcher" })
        });
        assert(execRes.status === 200, `Execute dispatch for action #${actionId} returns 200 OK`);
        const execData = await execRes.json();
        assert(execData.success === true, "Execution response has success=true");
        assert(execData.action.result === "RECOVERED", "Action result is updated to RECOVERED");
        assert(Number(execData.action.recovered_amount) > 0, `Recovered amount is positive (₹${execData.action.recovered_amount})`);

        // Amount cap verification: never exceeds original transaction amount
        const origAmount = parseFloat(safeTx.amount);
        const recAmount = parseFloat(execData.action.recovered_amount);
        assert(recAmount <= origAmount, `Recovered amount (₹${recAmount}) does not exceed original amount (₹${origAmount})`);
        assert(recAmount === origAmount, `Recovered amount equals 100% GMV (₹${recAmount} == ₹${origAmount})`);

        // -------------------------------------------------------------
        // TEST 3: Idempotent Duplicate Execution Protection
        // -------------------------------------------------------------
        console.log("\n🔹 3. Idempotency & Duplicate Execution Protection");
        const dupExecRes = await fetch(`${BASE_URL}/execute/${actionId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
        assert(dupExecRes.status === 200, "Subsequent execution request returns 200 OK (idempotent)");
        const dupData = await dupExecRes.json();
        assert(dupData.success === true, "Duplicate execution response has success=true");
        assert(dupData.already_executed === true, "Duplicate execution is flagged as already_executed=true");
        assert(parseFloat(dupData.action.recovered_amount) === origAmount, "Recovered amount is not double-counted");

        // -------------------------------------------------------------
        // TEST 4: Audit Trail Telemetry Creation
        // -------------------------------------------------------------
        console.log("\n🔹 4. Audit Trail Telemetry & Non-Repudiation Logging");
        const auditRes = await pool.query(`
            SELECT * FROM audit_logs
            WHERE action_id = $1 AND event_type = 'RECOVERY_EXECUTION'
            ORDER BY log_id DESC LIMIT 1
        `, [actionId]);
        assert(auditRes.rows.length === 1, `Audit log entry created for RECOVERY_EXECUTION (action #${actionId})`);
        const auditRow = auditRes.rows[0];
        assert(auditRow.event_type === "RECOVERY_EXECUTION", "Audit log event_type is RECOVERY_EXECUTION");
        assert(auditRow.outcome === "RECOVERY_SUCCESSFUL", "Audit log outcome is RECOVERY_SUCCESSFUL");
        assert(auditRow.actor.includes("Test_Automated_Dispatcher") || auditRow.actor.includes("RecoverAI"), "Audit log records dispatcher actor");

        // -------------------------------------------------------------
        // TEST 5: Guardrail Blocking for Unapproved / Escalated Action
        // -------------------------------------------------------------
        console.log("\n🔹 5. Guardrail Re-Check & Human Review Blocking");
        // Find or create high-fraud / escalated action
        const highRiskTxRes = await pool.query(`
            SELECT * FROM transactions
            WHERE status = 'FAILED' AND fraud_score >= 0.70
            ORDER BY transaction_id ASC
            LIMIT 1
        `);
        assert(highRiskTxRes.rows.length > 0, "Found high-risk/escalated transaction in DB");
        const highRiskTx = highRiskTxRes.rows[0];
        const highRiskAnalysis = await analyzeAndRecordTransaction(highRiskTx, pool);
        const highRiskActionId = highRiskAnalysis.actionId;

        // Attempt to execute without human sign-off -> MUST BE BLOCKED
        const blockedExecRes = await fetch(`${BASE_URL}/execute/${highRiskActionId}`, {
            method: "POST"
        });
        assert(blockedExecRes.status === 400, "Unapproved high-risk action execution is blocked with 400 Bad Request");
        const blockedData = await blockedExecRes.json();
        assert(blockedData.success === false, "Blocked execution response has success=false");
        assert(blockedData.error === "EXECUTION_BLOCKED", "Error code is EXECUTION_BLOCKED");

        // Verify DB row was NOT marked as recovered
        const checkActionDb = await pool.query(`SELECT * FROM recovery_actions WHERE action_id = $1`, [highRiskActionId]);
        assert(checkActionDb.rows[0].result !== "RECOVERED", "Blocked action is not marked as RECOVERED in DB");
        assert(Number(checkActionDb.rows[0].recovered_amount || 0) === 0, "Blocked action recovered_amount remains 0.00");

        // -------------------------------------------------------------
        // TEST 6: Human-Authorized Action Execution
        // -------------------------------------------------------------
        console.log("\n🔹 6. Execution of Human-Authorized Action");
        // Operator reviews and APPROVES the escalated action
        await reviewRecoveryAction(highRiskActionId, {
            decision: "APPROVE",
            reviewer: "RiskLead_Supervisor",
            reason: "High-risk customer verified via 2FA & manual check."
        });

        // Now executing the human-approved action should succeed
        const humanApprovedExecRes = await fetch(`${BASE_URL}/execute/${highRiskActionId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dispatcher: "Enterprise_Dispatcher" })
        });
        assert(humanApprovedExecRes.status === 200, "Human-approved action executes successfully with 200 OK");
        const humanApprovedData = await humanApprovedExecRes.json();
        assert(humanApprovedData.success === true, "Human-approved execution has success=true");
        assert(humanApprovedData.action.result === "RECOVERED", "Human-approved action status updated to RECOVERED");
        assert(parseFloat(humanApprovedData.action.recovered_amount) === parseFloat(highRiskTx.amount), "High-risk amount successfully recovered upon human sign-off");

    } catch (err) {
        console.error("Test execution error:", err);
        failedTests++;
        bugs.push(err.message);
    } finally {
        console.log("\n=======================================================");
        console.log(` Test Summary: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
        if (bugs.length > 0) {
            console.log("\n ❌ DEFECTS DISCOVERED:");
            bugs.forEach(b => console.log(`   - ${b}`));
        } else {
            console.log(" 🏆 ZERO DEFECTS FOUND. All execution, safety, and idempotency assertions passed!");
        }
        console.log("=======================================================\n");

        if (testServer) {
            await new Promise((resolve) => testServer.close(resolve));
        }
        await pool.end();
        process.exit(failedTests === 0 ? 0 : 1);
    }
}

runRecoveryExecutionTests();
