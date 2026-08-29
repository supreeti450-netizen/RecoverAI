const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const pool = require("../db");
const { analyzeTransaction } = require("../agents/recoveryAgent");
const { validateRecoveryAction } = require("../services/guardrails/guardrailEngine");
const {
    analyzeAndRecordTransaction,
    runBatchAnalysis,
    getTransactionsList,
    getRecoveryActions,
    getAnalyticsSummary,
    cleanupInvalidRecoveryRecords
} = require("../services/recoveryEngine");

let testCount = 0;
let passCount = 0;
let failCount = 0;

function assert(condition, testName, extra = "") {
    testCount++;
    if (condition) {
        passCount++;
        console.log(`  ✅ PASS: ${testName}`);
    } else {
        failCount++;
        console.error(`  ❌ FAIL: ${testName} ${extra ? `(${extra})` : ""}`);
    }
}

async function runRecoveryWorkflowTests() {
    console.log("\n=======================================================");
    console.log(" RecoverAI Logic Audit: Automated Recovery Workflow Tests");
    console.log("=======================================================\n");

    try {
        // Cleanup check before starting
        await cleanupInvalidRecoveryRecords(pool);

        // -------------------------------------------------------------
        // TEST 1: SUCCESS transaction cannot enter recovery workflow in Agent
        // -------------------------------------------------------------
        console.log("🔹 1. Agent & Guardrail Unit Validation for SUCCESS transactions");
        const successTxMock = {
            transaction_id: "RP_MOCK_SUCCESS",
            amount: 75000, // high value
            status: "SUCCESS",
            failure_reason: null,
            retry_count: 0,
            fraud_score: 0.85, // high fraud score
            recovery_probability: 0.0
        };

        const agentSuccessDecision = analyzeTransaction(successTxMock);
        assert(
            agentSuccessDecision.decision === "NO_RECOVERY_NEEDED",
            "Agent returns NO_RECOVERY_NEEDED for SUCCESS transaction",
            JSON.stringify(agentSuccessDecision)
        );
        assert(
            agentSuccessDecision.requiresHuman === false,
            "Agent returns requiresHuman=false for SUCCESS transaction"
        );
        assert(
            agentSuccessDecision.confidence === 0,
            "Agent returns confidence=0 for SUCCESS transaction"
        );

        const guardrailSuccessDecision = validateRecoveryAction(successTxMock, agentSuccessDecision);
        assert(
            guardrailSuccessDecision.allowed === false,
            "Guardrail blocks recovery for SUCCESS transaction (allowed=false)"
        );
        assert(
            guardrailSuccessDecision.escalationRequired === false,
            "Guardrail does NOT escalate SUCCESS transaction to human review (escalationRequired=false)"
        );
        assert(
            guardrailSuccessDecision.finalAction === "NO_RECOVERY_NEEDED",
            "Guardrail finalAction is NO_RECOVERY_NEEDED"
        );

        // -------------------------------------------------------------
        // TEST 2: FAILED transaction enters recovery workflow properly
        // -------------------------------------------------------------
        console.log("\n🔹 2. Agent & Guardrail Unit Validation for FAILED transactions");
        const failedTxMock = {
            transaction_id: "RP_MOCK_FAILED",
            amount: 1500,
            payment_method: "UPI",
            status: "FAILED",
            failure_reason: "UPI_TIMEOUT",
            retry_count: 0,
            fraud_score: 0.12,
            recovery_probability: 0.82
        };

        const agentFailedDecision = analyzeTransaction(failedTxMock);
        assert(
            agentFailedDecision.decision === "WAIT_AND_RETRY",
            "Agent analyzes FAILED transaction with UPI_TIMEOUT as WAIT_AND_RETRY",
            agentFailedDecision.decision
        );

        const guardrailFailedDecision = validateRecoveryAction(failedTxMock, agentFailedDecision);
        assert(
            guardrailFailedDecision.allowed === true,
            "Guardrail allows safe recovery for low-risk FAILED transaction"
        );
        assert(
            guardrailFailedDecision.escalationRequired === false,
            "Safe failed transaction is automated without human escalation"
        );

        // -------------------------------------------------------------
        // TEST 3: Database Service Layer: SUCCESS transaction never records action
        // -------------------------------------------------------------
        console.log("\n🔹 3. Database Service Layer Validation for Real DB Transactions");
        const realSuccessTxRes = await pool.query(
            "SELECT * FROM transactions WHERE status = 'SUCCESS' LIMIT 1"
        );
        assert(realSuccessTxRes.rows.length > 0, "Found real SUCCESS transaction in DB");
        const realSuccessTx = realSuccessTxRes.rows[0];

        const analysisRes = await analyzeAndRecordTransaction(realSuccessTx);
        assert(
            analysisRes.eligible === false,
            `analyzeAndRecordTransaction returns eligible=false for ${realSuccessTx.transaction_id}`
        );
        assert(
            analysisRes.actionId === null,
            "analyzeAndRecordTransaction does NOT create an actionId for SUCCESS transaction"
        );

        const checkDbAction = await pool.query(
            "SELECT * FROM recovery_actions WHERE transaction_id = $1",
            [realSuccessTx.transaction_id]
        );
        assert(
            checkDbAction.rows.length === 0,
            `No recovery_actions record exists in database for ${realSuccessTx.transaction_id}`
        );

        // -------------------------------------------------------------
        // TEST 4: Human Review Filter / Queue contains ONLY FAILED transactions
        // -------------------------------------------------------------
        console.log("\n🔹 4. Human Review Queue & Filter Validation");
        const humanReviewActions = await getRecoveryActions({ requires_human: true, limit: 100 });
        assert(
            Array.isArray(humanReviewActions.data),
            "getRecoveryActions returns list of human review actions"
        );

        let nonFailedInReviewQueue = 0;
        for (const act of humanReviewActions.data) {
            const txCheck = await pool.query(
                "SELECT status FROM transactions WHERE transaction_id = $1",
                [act.transaction_id]
            );
            if (txCheck.rows.length > 0 && txCheck.rows[0].status !== "FAILED") {
                nonFailedInReviewQueue++;
            }
        }
        assert(
            nonFailedInReviewQueue === 0,
            "Human review queue contains ZERO non-FAILED transactions"
        );

        // Test getTransactionsList with requires_human = true filter
        const txListWithHumanFilter = await getTransactionsList({ requires_human: true, limit: 100 });
        let nonFailedInTxListFilter = 0;
        for (const tx of txListWithHumanFilter.data) {
            if (tx.status !== "FAILED") {
                nonFailedInTxListFilter++;
            }
        }
        assert(
            nonFailedInTxListFilter === 0,
            "getTransactionsList with requires_human=true returns ONLY transactions with status=FAILED"
        );

        // Verify RP000001 specifically
        const rp1List = await getTransactionsList({ search: "RP000001" });
        if (rp1List.data.length > 0) {
            const rp1 = rp1List.data[0];
            assert(
                rp1.status === "SUCCESS",
                "RP000001 status is confirmed SUCCESS"
            );
            assert(
                rp1.requires_human === false,
                "RP000001 requires_human is strictly false in transactions query"
            );
            assert(
                rp1.action_type === null,
                "RP000001 action_type is null in transactions query"
            );
        }

        // -------------------------------------------------------------
        // TEST 5: Batch Analysis skips SUCCESS transactions
        // -------------------------------------------------------------
        console.log("\n🔹 5. Batch Analysis Ingestion Safety Validation");
        const batchRes = await runBatchAnalysis();
        assert(
            typeof batchRes.total_failed_transactions === "number",
            "Batch analysis operates over total_failed_transactions"
        );
        assert(
            batchRes.total_failed_transactions === 184,
            "Batch analysis counts exactly 184 failed transactions (skipping all 816 success transactions)"
        );

        // -------------------------------------------------------------
        // TEST 6: Analytics Summary Integrity
        // -------------------------------------------------------------
        console.log("\n🔹 6. Analytics Summary Consistency");
        const summary = await getAnalyticsSummary();
        assert(
            summary.total_transactions === 1000,
            "Total transactions is 1000"
        );
        assert(
            summary.successful_transactions === 816,
            "Successful transactions is 816"
        );
        assert(
            summary.failed_transactions === 184,
            "Failed transactions is 184"
        );
        assert(
            summary.total_analyzed_actions <= 184,
            "Total analyzed actions cannot exceed total failed transactions (184)"
        );

    } catch (err) {
        console.error("Test execution error:", err);
        failCount++;
    } finally {
        console.log("\n=======================================================");
        console.log(` Test Summary: Total: ${testCount} | Passed: ${passCount} | Failed: ${failCount}`);
        console.log("=======================================================\n");
        await pool.end();
        process.exit(failCount === 0 ? 0 : 1);
    }
}

runRecoveryWorkflowTests();
