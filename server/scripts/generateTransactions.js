require("dotenv").config();
const pool = require("../db");

const paymentMethods = ["UPI", "CARD", "NETBANKING", "WALLET"];

const banks = [
    "HDFC",
    "ICICI",
    "SBI",
    "AXIS",
    "KOTAK"
];

const upiApps = [
    "GooglePay",
    "PhonePe",
    "Paytm",
    "BHIM"
];

const failureReasons = [
    "UPI_TIMEOUT",
    "BANK_DECLINED",
    "INSUFFICIENT_FUNDS",
    "NETWORK_ERROR",
    "PAYMENT_TIMEOUT",
    "CARD_DECLINED"
];

function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function randomAmount() {
    return Number((Math.random() * 49500 + 500).toFixed(2));
}

function randomSuccessRate() {
    return Number((Math.random() * 0.35 + 0.60).toFixed(4));
}

async function generateTransactions() {

    console.log("🚀 Generating RecoverAI transactions...");

    const client = await pool.connect();

    try {

        for (let i = 1; i <= 1000; i++) {

            const transactionId =
                `RP${String(i).padStart(6, "0")}`;

            const merchantId =
                `MERCHANT${Math.floor(Math.random() * 10) + 1}`;

            const customerId =
                `CUSTOMER${Math.floor(Math.random() * 500) + 1}`;

            const amount = randomAmount();

            const paymentMethod =
                randomItem(paymentMethods);

            const bank =
                randomItem(banks);

            const upiApp =
                paymentMethod === "UPI"
                    ? randomItem(upiApps)
                    : null;

            /*
             * Around 82% successful payments
             * and 18% failed payments.
             */
            const isFailed =
                Math.random() < 0.18;

            const status =
                isFailed ? "FAILED" : "SUCCESS";

            const failureReason =
                isFailed
                    ? randomItem(failureReasons)
                    : null;

            const retryCount =
                isFailed
                    ? Math.floor(Math.random() * 3)
                    : 0;

            const successRate =
                randomSuccessRate();

            const checkoutDuration =
                Math.floor(Math.random() * 240) + 20;

            const subscriptionStatus =
                Math.random() < 0.35
                    ? "ACTIVE"
                    : "NONE";

            const fraudScore =
                Number(Math.random().toFixed(4));

            /*
             * Basic recovery probability.
             * We'll replace this with our actual
             * AI/ML model later.
             */
            let recoveryProbability = 0;

            if (isFailed) {

                recoveryProbability =
                    successRate * 0.7 +
                    (retryCount === 0 ? 0.2 : 0.05) +
                    (fraudScore < 0.3 ? 0.1 : 0);

                recoveryProbability =
                    Math.min(
                        recoveryProbability,
                        0.99
                    );
            }

            const revenueAtRisk =
                isFailed && recoveryProbability >= 0.5
                    ? Number(
                        (amount * recoveryProbability)
                        .toFixed(2)
                    )
                    : 0;

            await client.query(
                `
                INSERT INTO transactions (
                    transaction_id,
                    merchant_id,
                    customer_id,
                    amount,
                    currency,
                    transaction_time,
                    payment_method,
                    bank,
                    upi_app,
                    status,
                    failure_reason,
                    retry_count,
                    customer_success_rate,
                    checkout_duration,
                    subscription_status,
                    fraud_score,
                    recovery_probability,
                    revenue_at_risk
                )
                VALUES (
                    $1,$2,$3,$4,'INR',
                    NOW(),
                    $5,$6,$7,$8,$9,
                    $10,$11,$12,$13,$14,
                    $15,$16
                )
                `,
                [
                    transactionId,
                    merchantId,
                    customerId,
                    amount,
                    paymentMethod,
                    bank,
                    upiApp,
                    status,
                    failureReason,
                    retryCount,
                    successRate,
                    checkoutDuration,
                    subscriptionStatus,
                    fraudScore,
                    recoveryProbability,
                    revenueAtRisk
                ]
            );
        }

        console.log(
            "✅ 1,000 transactions generated successfully!"
        );

    } catch (error) {

        console.error(
            "❌ Error generating transactions:",
            error
        );

    } finally {

        client.release();
        await pool.end();
    }
}

generateTransactions();
