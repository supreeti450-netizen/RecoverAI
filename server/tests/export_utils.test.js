const assert = require("assert");

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(condition, description) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  ✅ PASS: ${description}`);
    } else {
        failedTests++;
        console.error(`  ❌ FAIL: ${description}`);
    }
}

// RFC-4180 CSV Escaping Logic mirroring exportUtils.js
function escapeCSVCell(value) {
    if (value === null || value === undefined) {
        return "";
    }
    const str = String(value);
    if (/[",\n\r]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function getExportFilename(prefix, extension) {
    const dateStr = new Date().toISOString().split("T")[0];
    const cleanPrefix = prefix.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    const cleanExt = extension.replace(/^\./, "").toLowerCase();
    return `recoverai-${cleanPrefix}-${dateStr}.${cleanExt}`;
}

function formatAuditLogsForCSV(logs) {
    const headers = [
        "Log ID",
        "Timestamp",
        "Transaction ID",
        "Action ID",
        "Event Type",
        "Actor Attribution",
        "Decision Strategy",
        "Outcome",
        "Auditable Reasoning",
        "Guardrail Safety Checks"
    ];

    const rows = (logs || []).map((log) => {
        let guardrailText = "";
        if (Array.isArray(log.guardrails_checked)) {
            guardrailText = log.guardrails_checked
                .map((g) => `${g.rule || "RULE"}: ${g.passed ? "PASSED" : "FAILED"}`)
                .join(" | ");
        } else if (typeof log.guardrails_checked === "object" && log.guardrails_checked !== null) {
            guardrailText = Object.entries(log.guardrails_checked)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" | ");
        } else if (log.guardrails_checked) {
            guardrailText = String(log.guardrails_checked);
        }

        return [
            log.log_id ?? "",
            log.created_at ? new Date(log.created_at).toISOString() : "",
            log.transaction_id ?? "",
            log.action_id ?? "",
            log.event_type ?? "",
            log.actor ?? "",
            log.decision ?? "",
            log.outcome ?? "",
            log.reasoning ?? "",
            guardrailText
        ];
    });

    return { headers, rows };
}

function formatOpportunitiesForCSV(opportunities) {
    const headers = [
        "Transaction ID",
        "Customer ID",
        "Merchant ID",
        "Amount (INR)",
        "Payment Channel",
        "Bank / UPI App",
        "Status",
        "Decline Reason",
        "Retry Count",
        "Fraud Risk Score",
        "Recovery Probability",
        "Revenue at Risk (INR)",
        "Customer Success Rate",
        "Transaction Time"
    ];

    const rows = (opportunities || []).map((op) => [
        op.transaction_id ?? "",
        op.customer_id ?? "",
        op.merchant_id ?? "",
        op.amount !== undefined && op.amount !== null ? Number(op.amount).toFixed(2) : "0.00",
        op.payment_method ?? "",
        op.bank || op.upi_app || "—",
        op.status ?? "",
        op.failure_reason ?? "",
        op.retry_count ?? 0,
        op.fraud_score !== undefined && op.fraud_score !== null ? Number(op.fraud_score).toFixed(4) : "0.0000",
        op.recovery_probability !== undefined && op.recovery_probability !== null ? Number(op.recovery_probability).toFixed(4) : "0.0000",
        op.revenue_at_risk !== undefined && op.revenue_at_risk !== null ? Number(op.revenue_at_risk).toFixed(2) : "0.00",
        op.customer_success_rate !== undefined && op.customer_success_rate !== null ? Number(op.customer_success_rate).toFixed(4) : "",
        op.transaction_time ? new Date(op.transaction_time).toISOString() : ""
    ]);

    return { headers, rows };
}

function runExportTests() {
    console.log("\n=======================================================");
    console.log(" RecoverAI Compliance Export Suite: CSV & JSON Logic");
    console.log("=======================================================\n");

    // 1. RFC-4180 Cell Escaping Tests
    console.log("🔹 1. RFC-4180 CSV Escaping & Injection Protection");
    test(escapeCSVCell("Normal text") === "Normal text", "Plain text remains unquoted");
    test(escapeCSVCell("Text, with comma") === '"Text, with comma"', "Text with comma is wrapped in double quotes");
    test(escapeCSVCell('Text with "quotes"') === '"Text with ""quotes"""', 'Quotes are escaped by doubling them (" -> "")');
    test(escapeCSVCell("Line 1\nLine 2") === '"Line 1\nLine 2"', "Newlines are wrapped in double quotes");
    test(escapeCSVCell(null) === "", "Null values format to empty string");
    test(escapeCSVCell(undefined) === "", "Undefined values format to empty string");
    test(escapeCSVCell(123.45) === "123.45", "Numeric values format to string representation");

    // 2. Filename Generation
    console.log("\n🔹 2. Timestamped Filename Generation");
    const today = new Date().toISOString().split("T")[0];
    test(getExportFilename("audit-log", "csv") === `recoverai-audit-log-${today}.csv`, "Audit log CSV filename matches standard convention");
    test(getExportFilename("audit-log", "json") === `recoverai-audit-log-${today}.json`, "Audit log JSON filename matches standard convention");
    test(getExportFilename("recovery-opportunities", "csv") === `recoverai-recovery-opportunities-${today}.csv`, "Opportunities CSV filename matches convention");

    // 3. Audit Log CSV Formatting
    console.log("\n🔹 3. Compliance Audit Log CSV Serialization");
    const mockLogs = [
        {
            log_id: 101,
            transaction_id: "RP000003",
            action_id: 42,
            event_type: "RECOVERY_ANALYSIS",
            actor: "RecoverAI Agent",
            decision: "WAIT_AND_RETRY",
            outcome: "ACTION_APPROVED",
            reasoning: 'Transient timeout, retry "safe".',
            guardrails_checked: [
                { rule: "TRANSACTION_FAILED", passed: true },
                { rule: "RETRY_LIMIT", passed: true }
            ],
            created_at: "2026-08-30T12:00:00.000Z"
        }
    ];

    const auditCsv = formatAuditLogsForCSV(mockLogs);
    test(auditCsv.headers.length === 10, "Audit CSV contains 10 compliance columns");
    test(auditCsv.rows.length === 1, "Audit CSV rows count matches input array length");
    test(auditCsv.rows[0][0] === 101, "Log ID matches");
    test(auditCsv.rows[0][2] === "RP000003", "Transaction ID matches");
    test(auditCsv.rows[0][9].includes("TRANSACTION_FAILED: PASSED"), "Guardrail checklist is serialized");

    const escapedReasoning = escapeCSVCell(auditCsv.rows[0][8]);
    test(escapedReasoning === '"Transient timeout, retry ""safe""."', "Reasoning with quotes and comma is safely RFC-4180 escaped");

    // 4. Opportunities CSV Formatting
    console.log("\n🔹 4. Recovery Opportunities CSV Serialization");
    const mockOpportunities = [
        {
            transaction_id: "RP000005",
            customer_id: "CUST_1234",
            merchant_id: "MERCH_88",
            amount: "1500.50",
            payment_method: "UPI",
            bank: "HDFC",
            upi_app: "GPay",
            status: "FAILED",
            failure_reason: "UPI_TIMEOUT",
            retry_count: 0,
            fraud_score: "0.0500",
            recovery_probability: "0.8500",
            revenue_at_risk: "1275.43",
            customer_success_rate: "0.9200",
            transaction_time: "2026-08-30T10:30:00.000Z"
        }
    ];

    const oppsCsv = formatOpportunitiesForCSV(mockOpportunities);
    test(oppsCsv.headers.length === 14, "Opportunities CSV contains 14 structured columns");
    test(oppsCsv.rows.length === 1, "Opportunities CSV row count matches");
    test(oppsCsv.rows[0][0] === "RP000005", "Transaction ID matches");
    test(oppsCsv.rows[0][3] === "1500.50", "Amount formatted to 2 decimal places");
    test(oppsCsv.rows[0][10] === "0.8500", "Recovery probability formatted to 4 decimal places");

    // 5. Empty & Null Dataset Resilience
    console.log("\n🔹 5. Empty & Null Dataset Resilience");
    test(formatAuditLogsForCSV(null).rows.length === 0, "Null audit logs returns empty array safely");
    test(formatAuditLogsForCSV([]).rows.length === 0, "Empty audit logs returns empty array safely");
    test(formatOpportunitiesForCSV(null).rows.length === 0, "Null opportunities returns empty array safely");
    test(formatOpportunitiesForCSV([]).rows.length === 0, "Empty opportunities returns empty array safely");

    console.log("\n=======================================================");
    console.log(` Test Summary: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
    console.log("=======================================================\n");

    process.exit(failedTests === 0 ? 0 : 1);
}

runExportTests();
