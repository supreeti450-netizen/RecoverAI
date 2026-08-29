const express = require("express");
const pool = require("../db");
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

const router = express.Router();

// ----------------------------------------------------
// 0. Transactions List (Search, Filter, Pagination)
// ----------------------------------------------------
router.get("/transactions", async (req, res) => {
    try {
        const {
            search,
            status,
            payment_method,
            failure_reason,
            requires_human,
            sort_by,
            sort_order,
            page,
            limit
        } = req.query;

        const result = await getTransactionsList({
            search,
            status,
            payment_method,
            failure_reason,
            requires_human,
            sort_by,
            sort_order,
            page,
            limit
        });

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error("Error fetching transactions list:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch transactions list"
        });
    }
});

// ----------------------------------------------------
// 1. Recovery Opportunities & Basic Summary
// ----------------------------------------------------
router.get("/opportunities", async (req, res) => {
    try {
        const opportunities = await getRecoveryOpportunities();
        res.json({
            success: true,
            count: opportunities.length,
            opportunities
        });
    } catch (error) {
        console.error("Error fetching opportunities:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch recovery opportunities"
        });
    }
});

router.get("/summary", async (req, res) => {
    try {
        const summary = await getRecoverySummary();
        res.json({
            success: true,
            summary
        });
    } catch (error) {
        console.error("Error fetching summary:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch recovery summary"
        });
    }
});

// ----------------------------------------------------
// 2. Analytics APIs (for Dashboards)
// ----------------------------------------------------
router.get("/analytics/summary", async (req, res) => {
    try {
        const summary = await getAnalyticsSummary();
        res.json({
            success: true,
            summary
        });
    } catch (error) {
        console.error("Error fetching analytics summary:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch analytics summary"
        });
    }
});

router.get("/analytics/payment-methods", async (req, res) => {
    try {
        const data = await getPaymentMethodAnalytics();
        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        console.error("Error fetching payment method analytics:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch payment method analytics"
        });
    }
});

router.get("/analytics/failure-reasons", async (req, res) => {
    try {
        const data = await getFailureReasonAnalytics();
        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        console.error("Error fetching failure reasons analytics:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch failure reasons analytics"
        });
    }
});

// ----------------------------------------------------
// 3. Batch Analysis API
// ----------------------------------------------------
const handleBatchAnalysis = async (req, res) => {
    try {
        const { limit } = req.body || {};
        const summary = await runBatchAnalysis({ limit });
        res.json({
            success: true,
            message: "Batch analysis completed successfully",
            summary
        });
    } catch (error) {
        console.error("Error running batch analysis:", error);
        res.status(500).json({
            success: false,
            message: "Failed to run batch analysis",
            error: error.message
        });
    }
};

router.post("/batch-analyze", handleBatchAnalysis);
router.post("/analyze/batch", handleBatchAnalysis);
router.post("/analyze-batch", handleBatchAnalysis);

// ----------------------------------------------------
// 4. Audit Trail API
// ----------------------------------------------------
router.get("/audit-logs", async (req, res) => {
    try {
        const { transaction_id, event_type, page, limit } = req.query;
        const result = await getAuditLogs({
            transaction_id,
            event_type,
            page,
            limit
        });

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch audit logs"
        });
    }
});

// ----------------------------------------------------
// 5. Recovery Actions API
// ----------------------------------------------------
router.get("/actions", async (req, res) => {
    try {
        const { transaction_id, status, requires_human, page, limit } = req.query;
        const result = await getRecoveryActions({
            transaction_id,
            status,
            requires_human,
            page,
            limit
        });

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error("Error fetching recovery actions:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch recovery actions"
        });
    }
});

// ----------------------------------------------------
// 6. Human Review API
// ----------------------------------------------------
router.post("/human-review/:actionId", async (req, res) => {
    try {
        const { actionId } = req.params;
        const { decision, reviewer, reason } = req.body || {};

        if (!decision || !reviewer || !reason) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: 'decision' ('APPROVE' | 'REJECT'), 'reviewer', and 'reason' are required."
            });
        }

        const reviewResult = await reviewRecoveryAction(actionId, {
            decision,
            reviewer,
            reason
        });

        if (reviewResult.error) {
            let statusCode = 400;
            if (reviewResult.error === "NOT_FOUND") {
                statusCode = 404;
            } else if (reviewResult.error === "NOT_ELIGIBLE") {
                statusCode = 400;
            }
            return res.status(statusCode).json({
                success: false,
                error: reviewResult.error,
                message: reviewResult.message
            });
        }

        res.json({
            success: true,
            message: `Recovery action #${actionId} successfully reviewed (${reviewResult.action.status})`,
            action: reviewResult.action,
            audit_log: reviewResult.audit_log
        });
    } catch (error) {
        console.error("Error processing human review:", error);
        res.status(500).json({
            success: false,
            message: "Failed to process human review"
        });
    }
});

// ----------------------------------------------------
// 7. Single Transaction Analysis API
// ----------------------------------------------------
router.get("/analyze/:transactionId", async (req, res) => {
    try {
        const { transactionId } = req.params;

        const result = await pool.query(
            `
            SELECT *
            FROM transactions
            WHERE transaction_id = $1
            `,
            [transactionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            });
        }

        const transaction = result.rows[0];
        const analysis = await analyzeAndRecordTransaction(transaction);

        res.json({
            success: true,
            transaction: {
                transaction_id: transaction.transaction_id,
                amount: transaction.amount,
                payment_method: transaction.payment_method,
                status: transaction.status,
                failure_reason: transaction.failure_reason,
                retry_count: transaction.retry_count,
                fraud_score: transaction.fraud_score,
                recovery_probability: transaction.status === "FAILED" ? transaction.recovery_probability : 0
            },
            agent_decision: analysis.agentDecision,
            guardrail_decision: analysis.guardrailDecision,
            action_id: analysis.actionId,
            is_new: analysis.isNew,
            is_eligible: analysis.eligible !== false
        });
    } catch (error) {
        console.error("Error analyzing transaction:", error);
        res.status(500).json({
            success: false,
            message: "Failed to analyze transaction"
        });
    }
});

module.exports = router;