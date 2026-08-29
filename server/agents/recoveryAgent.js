function analyzeTransaction(transaction) {
    // 0. Only failed transactions enter the recovery workflow
    if (!transaction || transaction.status !== "FAILED") {
        return {
            decision: "NO_RECOVERY_NEEDED",
            confidence: 0,
            reason: "Transaction was successful or not in a failed state. Recovery workflow is only applicable to failed transactions.",
            requiresHuman: false,
            isEligible: false
        };
    }

    const {
        amount,
        payment_method,
        failure_reason,
        retry_count,
        customer_success_rate,
        fraud_score,
        recovery_probability
    } = transaction;

    let decision = "DO_NOT_RECOVER";
    let confidence = Number(recovery_probability || 0);
    let reason = "";
    let requiresHuman = false;

    // 1. Fraud protection
    if (fraud_score >= 0.70) {
        return {
            decision: "HUMAN_REVIEW",
            confidence,
            reason: "Fraud risk is too high for automatic recovery.",
            requiresHuman: true
        };
    }

    // 2. Too many retries
    if (retry_count >= 2) {
        return {
            decision: "DO_NOT_RECOVER",
            confidence,
            reason: "Maximum automatic retry limit has been reached.",
            requiresHuman: false
        };
    }

    // 3. High-value transaction
    if (amount > 50000) {
        return {
            decision: "HUMAN_REVIEW",
            confidence,
            reason: "High-value transaction requires human approval.",
            requiresHuman: true
        };
    }

    // 4. UPI timeout
    if (
        payment_method === "UPI" &&
        failure_reason === "UPI_TIMEOUT"
    ) {
        decision = "WAIT_AND_RETRY";

        reason =
            "Temporary UPI timeout detected. " +
            "Customer has not exhausted retry attempts.";

        return {
            decision,
            confidence,
            reason,
            requiresHuman
        };
    }

    // 5. Network error
    if (failure_reason === "NETWORK_ERROR") {

        decision = "WAIT_AND_RETRY";

        reason =
            "Network-related payment failure may be temporary. " +
            "A delayed retry is recommended.";

        return {
            decision,
            confidence,
            reason,
            requiresHuman
        };
    }

    // 6. Bank declined
    if (failure_reason === "BANK_DECLINED") {

        decision = "CHANGE_PAYMENT_METHOD";

        reason =
            "The issuing bank declined the payment. " +
            "Retrying through the same route may have low value.";

        return {
            decision,
            confidence,
            reason,
            requiresHuman
        };
    }

    // 7. Insufficient funds
    if (failure_reason === "INSUFFICIENT_FUNDS") {

        decision = "SEND_PAYMENT_LINK";

        reason =
            "Insufficient funds detected. " +
            "The customer should be given another opportunity " +
            "to complete payment later.";

        return {
            decision,
            confidence,
            reason,
            requiresHuman
        };
    }

    // 8. Card declined
    if (
        payment_method === "CARD" &&
        failure_reason === "CARD_DECLINED"
    ) {

        decision = "CHANGE_PAYMENT_METHOD";

        reason =
            "Card payment was declined. " +
            "Suggesting an alternative payment method is preferable.";

        return {
            decision,
            confidence,
            reason,
            requiresHuman
        };
    }

    // 9. Generic recoverable failure
    if (recovery_probability >= 0.75) {

        decision = "RETRY_PAYMENT";

        reason =
            "High recovery probability with acceptable risk.";

        return {
            decision,
            confidence,
            reason,
            requiresHuman
        };
    }

    // 10. Low confidence
    decision = "HUMAN_REVIEW";
    requiresHuman = true;

    reason =
        "The recovery model does not have sufficient confidence " +
        "to automatically select an intervention.";

    return {
        decision,
        confidence,
        reason,
        requiresHuman
    };
}

module.exports = {
    analyzeTransaction
};