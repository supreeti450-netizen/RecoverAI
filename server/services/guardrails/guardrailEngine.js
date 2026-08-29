function validateRecoveryAction(transaction, agentDecision) {

    const checks = [];

    let allowed = true;
    let finalAction = agentDecision.decision;
    let escalationRequired = false;

    // 1. Transaction must actually be failed
    const transactionFailed =
        transaction && transaction.status === "FAILED";

    checks.push({
        rule: "TRANSACTION_FAILED",
        passed: Boolean(transactionFailed)
    });

    if (!transactionFailed) {
        return {
            allowed: false,
            finalAction: "NO_RECOVERY_NEEDED",
            escalationRequired: false,
            checks
        };
    }

    // 2. Maximum retry protection
    const retryAllowed =
        transaction.retry_count < 2;

    checks.push({
        rule: "RETRY_LIMIT",
        passed: retryAllowed
    });

    if (
        !retryAllowed &&
        (
            agentDecision.decision === "RETRY_PAYMENT" ||
            agentDecision.decision === "WAIT_AND_RETRY"
        )
    ) {
        allowed = false;
        finalAction = "DO_NOT_RECOVER";
    }

    // 3. Fraud protection
    const fraudAllowed =
        Number(transaction.fraud_score) < 0.70;

    checks.push({
        rule: "FRAUD_SCORE",
        passed: fraudAllowed
    });

    if (!fraudAllowed) {
        allowed = false;
        finalAction = "HUMAN_REVIEW";
        escalationRequired = true;
    }

    // 4. High-value transaction protection
    const amountAllowed =
        Number(transaction.amount) <= 50000;

    checks.push({
        rule: "TRANSACTION_AMOUNT",
        passed: amountAllowed
    });

    if (!amountAllowed) {
        allowed = false;
        finalAction = "HUMAN_REVIEW";
        escalationRequired = true;
    }

    // 5. AI confidence threshold
    const confidenceAllowed =
        Number(agentDecision.confidence) >= 0.75;

    checks.push({
        rule: "AI_CONFIDENCE",
        passed: confidenceAllowed
    });

    if (
        !confidenceAllowed &&
        agentDecision.decision !== "DO_NOT_RECOVER"
    ) {
        allowed = false;
        finalAction = "HUMAN_REVIEW";
        escalationRequired = true;
    }

    // 6. Human review decisions are never auto-executed
    if (agentDecision.decision === "HUMAN_REVIEW") {
        allowed = false;
        finalAction = "HUMAN_REVIEW";
        escalationRequired = true;
    }

    return {
        allowed,
        finalAction,
        escalationRequired,
        checks
    };
}

module.exports = {
    validateRecoveryAction
};