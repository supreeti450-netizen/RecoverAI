const pool = require("../db");
const { analyzeTransaction } = require("../agents/recoveryAgent");
const { validateRecoveryAction } = require("./guardrails/guardrailEngine");

/**
 * Removes any erroneous recovery_actions or audit_logs attached to non-FAILED transactions.
 */
async function cleanupInvalidRecoveryRecords(client = pool) {
    try {
        const deleteAuditRes = await client.query(`
            DELETE FROM audit_logs
            WHERE transaction_id IN (
                SELECT transaction_id FROM transactions WHERE status != 'FAILED'
            )
        `);
        const deleteActionsRes = await client.query(`
            DELETE FROM recovery_actions
            WHERE transaction_id IN (
                SELECT transaction_id FROM transactions WHERE status != 'FAILED'
            )
        `);
        return {
            deletedAuditLogs: deleteAuditRes.rowCount,
            deletedActions: deleteActionsRes.rowCount
        };
    } catch (err) {
        if (!err.message || !err.message.includes("Cannot use a pool after calling end")) {
            console.error("Error cleaning up invalid recovery records:", err);
        }
        return { deletedAuditLogs: 0, deletedActions: 0 };
    }
}

// Auto-run cleanup on engine startup
cleanupInvalidRecoveryRecords().catch(() => {});

/**
 * Analyzes a single transaction, runs guardrails, and records action & audit log
 * ONLY for transactions with status = 'FAILED'.
 */
async function analyzeAndRecordTransaction(transaction, client = pool) {
    // 0. Only failed transactions enter the recovery pipeline
    if (!transaction || transaction.status !== "FAILED") {
        return {
            isNew: false,
            eligible: false,
            actionId: null,
            action: null,
            agentDecision: {
                decision: "NO_RECOVERY_NEEDED",
                confidence: 0,
                reason: "Transaction was successful or not in a failed state. Recovery workflow is not applicable.",
                requiresHuman: false
            },
            guardrailDecision: {
                allowed: false,
                finalAction: "NO_RECOVERY_NEEDED",
                escalationRequired: false,
                checks: [
                    { rule: "TRANSACTION_FAILED", passed: false }
                ]
            }
        };
    }

    // Check if recovery action already exists for this transaction
    const existingActionRes = await client.query(
        `SELECT * FROM recovery_actions WHERE transaction_id = $1 ORDER BY action_id DESC LIMIT 1`,
        [transaction.transaction_id]
    );

    const agentDecision = analyzeTransaction(transaction);
    const guardrailDecision = validateRecoveryAction(transaction, agentDecision);

    if (existingActionRes.rows.length > 0) {
        const existingAction = existingActionRes.rows[0];
        return {
            isNew: false,
            eligible: true,
            actionId: existingAction.action_id,
            action: existingAction,
            agentDecision,
            guardrailDecision
        };
    }

    // Step 1: Insert into recovery_actions
    const actionResult = await client.query(
        `
        INSERT INTO recovery_actions
        (
            transaction_id,
            action_type,
            confidence,
            reason,
            status,
            requires_human,
            result
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        `,
        [
            transaction.transaction_id,
            agentDecision.decision,
            agentDecision.confidence,
            agentDecision.reason,
            guardrailDecision.allowed ? "APPROVED" : "BLOCKED",
            guardrailDecision.escalationRequired || agentDecision.requiresHuman || false,
            guardrailDecision.finalAction
        ]
    );

    const savedAction = actionResult.rows[0];

    // Step 2: Insert into audit_logs
    const auditResult = await client.query(
        `
        INSERT INTO audit_logs
        (
            transaction_id,
            action_id,
            event_type,
            actor,
            decision,
            reasoning,
            guardrails_checked,
            outcome
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        `,
        [
            transaction.transaction_id,
            savedAction.action_id,
            "RECOVERY_ANALYSIS",
            "RecoverAI Agent",
            guardrailDecision.finalAction,
            agentDecision.reason,
            JSON.stringify(guardrailDecision.checks),
            guardrailDecision.allowed ? "ACTION_APPROVED" : "ACTION_BLOCKED"
        ]
    );

    return {
        isNew: true,
        eligible: true,
        actionId: savedAction.action_id,
        action: savedAction,
        auditLog: auditResult.rows[0],
        agentDecision,
        guardrailDecision
    };
}

/**
 * Runs batch analysis across all failed transactions that have not yet been analyzed.
 */
async function runBatchAnalysis({ limit = null } = {}) {
    const client = await pool.connect();

    try {
        // 1. Get total failed transactions count
        const totalFailedRes = await client.query(
            "SELECT COUNT(*) AS total_failed, COALESCE(SUM(revenue_at_risk), 0) AS total_revenue_at_risk FROM transactions WHERE status = 'FAILED'"
        );
        const totalFailedCount = parseInt(totalFailedRes.rows[0].total_failed, 10) || 0;
        const totalRevenueAtRisk = parseFloat(totalFailedRes.rows[0].total_revenue_at_risk) || 0;

        // 2. Get count of failed transactions already analyzed
        const alreadyAnalyzedRes = await client.query(
            `
            SELECT COUNT(DISTINCT ra.transaction_id) AS count
            FROM recovery_actions ra
            JOIN transactions t ON ra.transaction_id = t.transaction_id
            WHERE t.status = 'FAILED'
            `
        );
        const alreadyAnalyzedCount = parseInt(alreadyAnalyzedRes.rows[0].count, 10) || 0;

        // 3. Fetch unanalyzed failed transactions only
        let unanalyzedQuery = `
            SELECT *
            FROM transactions
            WHERE status = 'FAILED'
              AND transaction_id NOT IN (
                  SELECT transaction_id FROM recovery_actions WHERE transaction_id IS NOT NULL
              )
            ORDER BY revenue_at_risk DESC
        `;
        const queryParams = [];
        if (limit && Number.isInteger(Number(limit)) && Number(limit) > 0) {
            queryParams.push(Number(limit));
            unanalyzedQuery += ` LIMIT $1`;
        }

        const unanalyzedRes = await client.query(unanalyzedQuery, queryParams);
        const transactionsToAnalyze = unanalyzedRes.rows;

        let newlyAnalyzed = 0;
        let approvedOpportunities = 0;
        let humanReviewCases = 0;
        let blockedActions = 0;
        let estimatedRecoverableRevenue = 0;

        for (const tx of transactionsToAnalyze) {
            const analysis = await analyzeAndRecordTransaction(tx, client);

            if (analysis.isNew) {
                newlyAnalyzed++;
                if (analysis.guardrailDecision.allowed) {
                    approvedOpportunities++;
                    estimatedRecoverableRevenue += parseFloat(tx.revenue_at_risk || 0);
                } else {
                    blockedActions++;
                }

                if (analysis.guardrailDecision.escalationRequired || analysis.agentDecision.requiresHuman) {
                    humanReviewCases++;
                }
            }
        }

        return {
            total_failed_transactions: totalFailedCount,
            already_analyzed: alreadyAnalyzedCount,
            newly_analyzed: newlyAnalyzed,
            skipped: alreadyAnalyzedCount,
            total_analyzed: alreadyAnalyzedCount + newlyAnalyzed,
            approved_opportunities: approvedOpportunities,
            human_review_cases: humanReviewCases,
            blocked_actions: blockedActions,
            total_revenue_at_risk: Number(totalRevenueAtRisk.toFixed(2)),
            estimated_recoverable_revenue: Number(estimatedRecoverableRevenue.toFixed(2))
        };
    } finally {
        client.release();
    }
}

/**
 * Retrieves recovery opportunities (top 50 high-probability recoverable failures).
 */
async function getRecoveryOpportunities() {
    const query = `
        SELECT
            transaction_id,
            merchant_id,
            customer_id,
            amount,
            payment_method,
            bank,
            upi_app,
            status,
            failure_reason,
            retry_count,
            customer_success_rate,
            fraud_score,
            recovery_probability,
            revenue_at_risk,
            transaction_time
        FROM transactions
        WHERE status = 'FAILED'
          AND recovery_probability >= 0.50
          AND retry_count < 2
          AND fraud_score < 0.70
        ORDER BY revenue_at_risk DESC
        LIMIT 50;
    `;

    const result = await pool.query(query);
    return result.rows;
}

/**
 * Retrieves summary statistics for recovery engine.
 */
async function getRecoverySummary() {
    const query = `
        SELECT
            COUNT(*) FILTER (
                WHERE status = 'FAILED'
            ) AS failed_transactions,

            COALESCE(
                SUM(amount) FILTER (
                    WHERE status = 'FAILED'
                ), 0
            ) AS failed_revenue,

            COUNT(*) FILTER (
                WHERE status = 'FAILED'
                AND recovery_probability >= 0.50
                AND retry_count < 2
                AND fraud_score < 0.70
            ) AS recoverable_transactions,

            COALESCE(
                SUM(revenue_at_risk) FILTER (
                    WHERE status = 'FAILED'
                    AND recovery_probability >= 0.50
                    AND retry_count < 2
                    AND fraud_score < 0.70
                ), 0
            ) AS revenue_at_risk
        FROM transactions;
    `;

    const result = await pool.query(query);
    return result.rows[0];
}

/**
 * Retrieves paginated audit logs with optional transaction_id and event_type filters.
 */
async function getAuditLogs({ transaction_id = null, event_type = null, page = 1, limit = 20 } = {}) {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (safePage - 1) * safeLimit;

    const countQuery = `
        SELECT COUNT(*) AS total
        FROM audit_logs
        WHERE ($1::text IS NULL OR transaction_id = $1)
          AND ($2::text IS NULL OR event_type = $2)
    `;

    const countRes = await pool.query(countQuery, [
        transaction_id ? transaction_id.trim() : null,
        event_type ? event_type.trim() : null
    ]);
    const total = parseInt(countRes.rows[0].total, 10) || 0;

    const dataQuery = `
        SELECT
            log_id,
            transaction_id,
            action_id,
            event_type,
            actor,
            decision,
            reasoning,
            guardrails_checked,
            outcome,
            created_at
        FROM audit_logs
        WHERE ($1::text IS NULL OR transaction_id = $1)
          AND ($2::text IS NULL OR event_type = $2)
        ORDER BY created_at DESC, log_id DESC
        LIMIT $3 OFFSET $4
    `;

    const dataRes = await pool.query(dataQuery, [
        transaction_id ? transaction_id.trim() : null,
        event_type ? event_type.trim() : null,
        safeLimit,
        offset
    ]);

    const formattedData = dataRes.rows.map(row => {
        let checks = row.guardrails_checked;
        if (typeof checks === "string") {
            try {
                checks = JSON.parse(checks);
            } catch {
                // keep original string if parsing fails
            }
        }
        return {
            ...row,
            guardrails_checked: checks
        };
    });

    return {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit) || 1,
        data: formattedData
    };
}

/**
 * Retrieves paginated recovery actions with optional status, requires_human, and transaction_id filters.
 * STRICT: Only returns actions for transactions where status = 'FAILED'.
 */
async function getRecoveryActions({ transaction_id = null, status = null, requires_human = null, page = 1, limit = 20 } = {}) {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (safePage - 1) * safeLimit;

    let reqHumanBool = null;
    if (requires_human === true || requires_human === "true") {
        reqHumanBool = true;
    } else if (requires_human === false || requires_human === "false") {
        reqHumanBool = false;
    }

    const countQuery = `
        SELECT COUNT(*) AS total
        FROM recovery_actions ra
        JOIN transactions t ON ra.transaction_id = t.transaction_id
        WHERE t.status = 'FAILED'
          AND ($1::text IS NULL OR ra.transaction_id = $1)
          AND ($2::text IS NULL OR ra.status = $2)
          AND ($3::boolean IS NULL OR ra.requires_human = $3)
    `;

    const countRes = await pool.query(countQuery, [
        transaction_id ? transaction_id.trim() : null,
        status ? status.trim().toUpperCase() : null,
        reqHumanBool
    ]);
    const total = parseInt(countRes.rows[0].total, 10) || 0;

    const dataQuery = `
        SELECT
            ra.action_id,
            ra.transaction_id,
            ra.action_type,
            ra.confidence,
            ra.reason,
            ra.status,
            ra.requires_human,
            ra.result,
            ra.recovered_amount,
            ra.created_at
        FROM recovery_actions ra
        JOIN transactions t ON ra.transaction_id = t.transaction_id
        WHERE t.status = 'FAILED'
          AND ($1::text IS NULL OR ra.transaction_id = $1)
          AND ($2::text IS NULL OR ra.status = $2)
          AND ($3::boolean IS NULL OR ra.requires_human = $3)
        ORDER BY ra.created_at DESC, ra.action_id DESC
        LIMIT $4 OFFSET $5
    `;

    const dataRes = await pool.query(dataQuery, [
        transaction_id ? transaction_id.trim() : null,
        status ? status.trim().toUpperCase() : null,
        reqHumanBool,
        safeLimit,
        offset
    ]);

    return {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit) || 1,
        data: dataRes.rows
    };
}

/**
 * Handles human review approval or rejection of an escalated recovery action.
 */
async function reviewRecoveryAction(actionId, { decision, reviewer, reason }) {
    const id = parseInt(actionId, 10);
    if (isNaN(id) || id <= 0) {
        return { error: "INVALID_ID", message: "Invalid actionId format" };
    }

    const cleanDecision = (decision || "").trim().toUpperCase();
    if (cleanDecision !== "APPROVE" && cleanDecision !== "REJECT") {
        return { error: "INVALID_DECISION", message: "Decision must be either 'APPROVE' or 'REJECT'" };
    }

    const cleanReviewer = (reviewer || "").trim();
    if (!cleanReviewer) {
        return { error: "MISSING_REVIEWER", message: "Reviewer name is required" };
    }

    const cleanReason = (reason || "").trim();
    if (!cleanReason) {
        return { error: "MISSING_REASON", message: "Reason for human review decision is required" };
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const actionRes = await client.query(
            `
            SELECT ra.*, t.status AS tx_status
            FROM recovery_actions ra
            JOIN transactions t ON ra.transaction_id = t.transaction_id
            WHERE ra.action_id = $1
            FOR UPDATE
            `,
            [id]
        );

        if (actionRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return { error: "NOT_FOUND", message: `Recovery action #${id} not found or not eligible` };
        }

        const action = actionRes.rows[0];

        // Ensure underlying transaction is FAILED
        if (action.tx_status !== "FAILED") {
            await client.query("ROLLBACK");
            return {
                error: "NOT_ELIGIBLE",
                message: `Transaction ${action.transaction_id} was successful. Recovery review is not applicable.`
            };
        }

        // Ensure action was marked for human review or is in reviewable state
        if (!action.requires_human && action.status !== "BLOCKED" && action.result !== "HUMAN_REVIEW") {
            await client.query("ROLLBACK");
            return {
                error: "NOT_ELIGIBLE",
                message: `Recovery action #${id} does not require human review or has already been reviewed`
            };
        }

        const newStatus = cleanDecision === "APPROVE" ? "APPROVED" : "REJECTED";
        const newResult = cleanDecision === "APPROVE" ? "APPROVED_BY_HUMAN" : "REJECTED_BY_HUMAN";
        const auditOutcome = cleanDecision === "APPROVE" ? "ACTION_APPROVED" : "ACTION_REJECTED";

        const updateRes = await client.query(
            `
            UPDATE recovery_actions
            SET status = $1,
                requires_human = false,
                result = $2
            WHERE action_id = $3
            RETURNING *
            `,
            [newStatus, newResult, id]
        );

        const updatedAction = updateRes.rows[0];

        const auditCheckInfo = {
            human_reviewer: cleanReviewer,
            human_decision: cleanDecision,
            previous_status: action.status,
            previous_result: action.result,
            reviewed_at: new Date().toISOString()
        };

        const auditRes = await client.query(
            `
            INSERT INTO audit_logs
            (
                transaction_id,
                action_id,
                event_type,
                actor,
                decision,
                reasoning,
                guardrails_checked,
                outcome
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
            `,
            [
                action.transaction_id,
                action.action_id,
                "HUMAN_REVIEW",
                cleanReviewer,
                cleanDecision,
                cleanReason,
                JSON.stringify(auditCheckInfo),
                auditOutcome
            ]
        );

        await client.query("COMMIT");

        return {
            success: true,
            action: updatedAction,
            audit_log: auditRes.rows[0]
        };
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Retrieves comprehensive analytics summary for dashboards.
 */
async function getAnalyticsSummary() {
    const query = `
        SELECT
            COUNT(*) AS total_transactions,
            COUNT(*) FILTER (WHERE status = 'SUCCESS') AS successful_transactions,
            COUNT(*) FILTER (WHERE status = 'FAILED') AS failed_transactions,
            COALESCE(SUM(amount), 0) AS total_transaction_value,
            COALESCE(SUM(amount) FILTER (WHERE status = 'SUCCESS'), 0) AS successful_revenue,
            COALESCE(SUM(amount) FILTER (WHERE status = 'FAILED'), 0) AS failed_revenue,
            COALESCE(SUM(revenue_at_risk) FILTER (WHERE status = 'FAILED'), 0) AS total_revenue_at_risk,
            COUNT(*) FILTER (
                WHERE status = 'FAILED'
                  AND recovery_probability >= 0.50
                  AND retry_count < 2
                  AND fraud_score < 0.70
            ) AS recovery_opportunities,
            COALESCE(
                (
                    SELECT COUNT(*)
                    FROM recovery_actions ra
                    JOIN transactions t ON ra.transaction_id = t.transaction_id
                    WHERE t.status = 'FAILED' AND (ra.requires_human = true OR ra.result = 'HUMAN_REVIEW')
                ), 0
            ) AS human_review_count,
            COALESCE(
                (
                    SELECT COUNT(*)
                    FROM recovery_actions ra
                    JOIN transactions t ON ra.transaction_id = t.transaction_id
                    WHERE t.status = 'FAILED' AND (ra.status = 'BLOCKED' OR ra.status = 'REJECTED')
                ), 0
            ) AS blocked_action_count,
            COALESCE(
                (
                    SELECT COUNT(*)
                    FROM recovery_actions ra
                    JOIN transactions t ON ra.transaction_id = t.transaction_id
                    WHERE t.status = 'FAILED' AND ra.status = 'APPROVED'
                ), 0
            ) AS approved_action_count,
            COALESCE(
                (
                    SELECT SUM(ra.recovered_amount)
                    FROM recovery_actions ra
                    JOIN transactions t ON ra.transaction_id = t.transaction_id
                    WHERE t.status = 'FAILED'
                ), 0
            ) AS recovered_amount,
            COALESCE(
                (
                    SELECT COUNT(*)
                    FROM recovery_actions ra
                    JOIN transactions t ON ra.transaction_id = t.transaction_id
                    WHERE t.status = 'FAILED'
                ), 0
            ) AS total_analyzed_actions
        FROM transactions;
    `;

    const result = await pool.query(query);
    const row = result.rows[0];

    return {
        total_transactions: parseInt(row.total_transactions, 10) || 0,
        successful_transactions: parseInt(row.successful_transactions, 10) || 0,
        failed_transactions: parseInt(row.failed_transactions, 10) || 0,
        total_transaction_value: parseFloat(row.total_transaction_value) || 0,
        successful_revenue: parseFloat(row.successful_revenue) || 0,
        failed_revenue: parseFloat(row.failed_revenue) || 0,
        total_revenue_at_risk: parseFloat(row.total_revenue_at_risk) || 0,
        recovery_opportunities: parseInt(row.recovery_opportunities, 10) || 0,
        human_review_count: parseInt(row.human_review_count, 10) || 0,
        blocked_action_count: parseInt(row.blocked_action_count, 10) || 0,
        approved_action_count: parseInt(row.approved_action_count, 10) || 0,
        recovered_amount: parseFloat(row.recovered_amount) || 0,
        total_analyzed_actions: parseInt(row.total_analyzed_actions, 10) || 0
    };
}

/**
 * Retrieves analytics grouped by payment methods.
 */
async function getPaymentMethodAnalytics() {
    const query = `
        SELECT
            payment_method,
            COUNT(*) AS total_transactions,
            COALESCE(SUM(amount), 0) AS total_amount,
            COUNT(*) FILTER (WHERE status = 'SUCCESS') AS successful_transactions,
            COUNT(*) FILTER (WHERE status = 'FAILED') AS failed_transactions,
            ROUND(
                (COUNT(*) FILTER (WHERE status = 'FAILED')::numeric / NULLIF(COUNT(*), 0)::numeric) * 100,
                2
            ) AS failure_rate_percentage,
            COALESCE(SUM(revenue_at_risk) FILTER (WHERE status = 'FAILED'), 0) AS revenue_at_risk,
            COUNT(*) FILTER (
                WHERE status = 'FAILED'
                  AND recovery_probability >= 0.50
                  AND retry_count < 2
                  AND fraud_score < 0.70
            ) AS recoverable_count,
            ROUND(AVG(amount), 2) AS average_amount,
            ROUND(AVG(fraud_score), 4) AS average_fraud_score
        FROM transactions
        WHERE payment_method IS NOT NULL
        GROUP BY payment_method
        ORDER BY total_amount DESC;
    `;

    const result = await pool.query(query);
    return result.rows.map(r => ({
        payment_method: r.payment_method,
        total_transactions: parseInt(r.total_transactions, 10) || 0,
        total_amount: parseFloat(r.total_amount) || 0,
        successful_transactions: parseInt(r.successful_transactions, 10) || 0,
        failed_transactions: parseInt(r.failed_transactions, 10) || 0,
        failure_rate_percentage: parseFloat(r.failure_rate_percentage) || 0,
        revenue_at_risk: parseFloat(r.revenue_at_risk) || 0,
        recoverable_count: parseInt(r.recoverable_count, 10) || 0,
        average_amount: parseFloat(r.average_amount) || 0,
        average_fraud_score: parseFloat(r.average_fraud_score) || 0
    }));
}

/**
 * Retrieves analytics grouped by failure reasons for failed transactions.
 */
async function getFailureReasonAnalytics() {
    const query = `
        WITH total_failed AS (
            SELECT COUNT(*) AS total_count FROM transactions WHERE status = 'FAILED'
        )
        SELECT
            failure_reason,
            COUNT(*) AS count,
            COALESCE(SUM(amount), 0) AS total_amount,
            COALESCE(SUM(revenue_at_risk), 0) AS revenue_at_risk,
            ROUND(AVG(recovery_probability), 4) AS avg_recovery_probability,
            COUNT(*) FILTER (
                WHERE recovery_probability >= 0.50
                  AND retry_count < 2
                  AND fraud_score < 0.70
            ) AS recoverable_count,
            ROUND(
                (COUNT(*)::numeric / NULLIF((SELECT total_count FROM total_failed)::numeric, 0)) * 100,
                2
            ) AS percentage_of_failures
        FROM transactions
        WHERE status = 'FAILED' AND failure_reason IS NOT NULL
        GROUP BY failure_reason
        ORDER BY count DESC;
    `;

    const result = await pool.query(query);
    return result.rows.map(r => ({
        failure_reason: r.failure_reason,
        count: parseInt(r.count, 10) || 0,
        total_amount: parseFloat(r.total_amount) || 0,
        revenue_at_risk: parseFloat(r.revenue_at_risk) || 0,
        avg_recovery_probability: parseFloat(r.avg_recovery_probability) || 0,
        recoverable_count: parseInt(r.recoverable_count, 10) || 0,
        percentage_of_failures: parseFloat(r.percentage_of_failures) || 0
    }));
}

/**
 * Retrieves paginated transactions list with search, filter, sorting, and joined AI recovery action details.
 * STRICT: Recovery action fields are ONLY joined for status = 'FAILED'.
 */
async function getTransactionsList({
    search = null,
    status = null,
    payment_method = null,
    failure_reason = null,
    requires_human = null,
    sort_by = "transaction_id",
    sort_order = "ASC",
    page = 1,
    limit = 20
} = {}) {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (safePage - 1) * safeLimit;

    let reqHumanBool = null;
    if (requires_human === true || requires_human === "true") {
        reqHumanBool = true;
    } else if (requires_human === false || requires_human === "false") {
        reqHumanBool = false;
    }

    const searchPattern = search && search.trim() ? `%${search.trim()}%` : null;
    const cleanStatus = status && status.trim() ? status.trim().toUpperCase() : null;
    const cleanPaymentMethod = payment_method && payment_method.trim() ? payment_method.trim().toUpperCase() : null;
    const cleanFailureReason = failure_reason && failure_reason.trim() ? failure_reason.trim().toUpperCase() : null;

    // Validate sort column to avoid SQL injection
    const allowedSortCols = {
        transaction_id: "t.transaction_id",
        amount: "t.amount",
        status: "t.status",
        payment_method: "t.payment_method",
        failure_reason: "t.failure_reason",
        retry_count: "t.retry_count",
        fraud_score: "t.fraud_score",
        recovery_probability: "t.recovery_probability",
        revenue_at_risk: "t.revenue_at_risk",
        transaction_time: "t.transaction_time"
    };

    const orderCol = allowedSortCols[sort_by] || "t.transaction_id";
    const orderDir = (sort_order || "").toUpperCase() === "DESC" ? "DESC" : "ASC";

    const countQuery = `
        SELECT COUNT(*) AS total
        FROM transactions t
        LEFT JOIN LATERAL (
            SELECT * FROM recovery_actions WHERE transaction_id = t.transaction_id ORDER BY action_id DESC LIMIT 1
        ) ra ON t.status = 'FAILED'
        WHERE ($1::text IS NULL OR t.transaction_id ILIKE $1 OR t.merchant_id ILIKE $1 OR t.customer_id ILIKE $1 OR t.bank ILIKE $1)
          AND ($2::text IS NULL OR t.status = $2)
          AND ($3::text IS NULL OR t.payment_method = $3)
          AND ($4::text IS NULL OR t.failure_reason = $4)
          AND (
              $5::boolean IS NULL
              OR ($5 = true AND t.status = 'FAILED' AND ra.requires_human = true)
              OR ($5 = false AND (t.status != 'FAILED' OR ra.requires_human = false OR ra.requires_human IS NULL))
          )
    `;

    const countRes = await pool.query(countQuery, [
        searchPattern,
        cleanStatus,
        cleanPaymentMethod,
        cleanFailureReason,
        reqHumanBool
    ]);
    const total = parseInt(countRes.rows[0].total, 10) || 0;

    const dataQuery = `
        SELECT
            t.transaction_id,
            t.merchant_id,
            t.customer_id,
            t.amount,
            t.currency,
            t.transaction_time,
            t.payment_method,
            t.bank,
            t.upi_app,
            t.status,
            t.failure_reason,
            t.retry_count,
            t.customer_success_rate,
            t.checkout_duration,
            t.subscription_status,
            t.fraud_score,
            t.recovery_probability,
            t.revenue_at_risk,
            t.created_at,
            CASE WHEN t.status = 'FAILED' THEN ra.action_id ELSE NULL END AS action_id,
            CASE WHEN t.status = 'FAILED' THEN ra.action_type ELSE NULL END AS action_type,
            CASE WHEN t.status = 'FAILED' THEN ra.confidence ELSE NULL END AS action_confidence,
            CASE WHEN t.status = 'FAILED' THEN ra.reason ELSE NULL END AS action_reason,
            CASE WHEN t.status = 'FAILED' THEN ra.status ELSE NULL END AS action_status,
            CASE WHEN t.status = 'FAILED' THEN ra.requires_human ELSE false END AS requires_human,
            CASE WHEN t.status = 'FAILED' THEN ra.result ELSE NULL END AS action_result,
            CASE WHEN t.status = 'FAILED' THEN ra.created_at ELSE NULL END AS action_executed_at,
            CASE WHEN t.status = 'FAILED' THEN ra.recovered_amount ELSE '0.00' END AS recovered_amount
        FROM transactions t
        LEFT JOIN LATERAL (
            SELECT * FROM recovery_actions WHERE transaction_id = t.transaction_id ORDER BY action_id DESC LIMIT 1
        ) ra ON t.status = 'FAILED'
        WHERE ($1::text IS NULL OR t.transaction_id ILIKE $1 OR t.merchant_id ILIKE $1 OR t.customer_id ILIKE $1 OR t.bank ILIKE $1)
          AND ($2::text IS NULL OR t.status = $2)
          AND ($3::text IS NULL OR t.payment_method = $3)
          AND ($4::text IS NULL OR t.failure_reason = $4)
          AND (
              $5::boolean IS NULL
              OR ($5 = true AND t.status = 'FAILED' AND ra.requires_human = true)
              OR ($5 = false AND (t.status != 'FAILED' OR ra.requires_human = false OR ra.requires_human IS NULL))
          )
        ORDER BY ${orderCol} ${orderDir}
        LIMIT $6 OFFSET $7
    `;

    const dataRes = await pool.query(dataQuery, [
        searchPattern,
        cleanStatus,
        cleanPaymentMethod,
        cleanFailureReason,
        reqHumanBool,
        safeLimit,
        offset
    ]);

    return {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit) || 1,
        data: dataRes.rows
    };
}

module.exports = {
    cleanupInvalidRecoveryRecords,
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
};