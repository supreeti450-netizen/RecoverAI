/**
 * Export Utilities for RecoverAI Command Center
 * Supports RFC-4180 compliant CSV formatting and structured JSON exports.
 */

/**
 * Escapes a cell value according to RFC-4180 rules:
 * - Wraps in double quotes if it contains commas, double quotes, or newlines.
 * - Escapes existing double quotes by doubling them (" -> "").
 */
export function escapeCSVCell(value) {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates standard timestamped export filenames (e.g. recoverai-audit-log-2026-08-30.csv).
 */
export function getExportFilename(prefix, extension) {
  const dateStr = new Date().toISOString().split('T')[0];
  const cleanPrefix = prefix.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const cleanExt = extension.replace(/^\./, '').toLowerCase();
  return `recoverai-${cleanPrefix}-${dateStr}.${cleanExt}`;
}

/**
 * Triggers client-side browser download for a Blob.
 */
export function triggerBlobDownload(blob, filename) {
  if (typeof window === 'undefined' || !window.URL || !window.document) {
    return false;
  }
  const url = window.URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = filename;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  return true;
}

/**
 * Exports data as RFC-4180 CSV with UTF-8 BOM.
 */
export function exportToCSV(filename, headers, rows) {
  if (!Array.isArray(headers) || !Array.isArray(rows)) {
    console.warn('exportToCSV: headers and rows must be arrays');
    return false;
  }

  const headerLine = headers.map(escapeCSVCell).join(',');
  const rowLines = rows.map((row) =>
    (Array.isArray(row) ? row : []).map(escapeCSVCell).join(',')
  );

  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  return triggerBlobDownload(blob, filename);
}

/**
 * Exports data as formatted JSON.
 */
export function exportToJSON(filename, data) {
  const jsonContent = JSON.stringify(data ?? [], null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  return triggerBlobDownload(blob, filename);
}

/**
 * Formats Audit Log records for CSV export.
 */
export function formatAuditLogsForCSV(logs) {
  const headers = [
    'Log ID',
    'Timestamp',
    'Transaction ID',
    'Action ID',
    'Event Type',
    'Actor Attribution',
    'Decision Strategy',
    'Outcome',
    'Auditable Reasoning',
    'Guardrail Safety Checks'
  ];

  const rows = (logs || []).map((log) => {
    let guardrailText = '';
    if (Array.isArray(log.guardrails_checked)) {
      guardrailText = log.guardrails_checked
        .map((g) => `${g.rule || 'RULE'}: ${g.passed ? 'PASSED' : 'FAILED'}`)
        .join(' | ');
    } else if (typeof log.guardrails_checked === 'object' && log.guardrails_checked !== null) {
      guardrailText = Object.entries(log.guardrails_checked)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' | ');
    } else if (log.guardrails_checked) {
      guardrailText = String(log.guardrails_checked);
    }

    return [
      log.log_id ?? '',
      log.created_at ? new Date(log.created_at).toISOString() : '',
      log.transaction_id ?? '',
      log.action_id ?? '',
      log.event_type ?? '',
      log.actor ?? '',
      log.decision ?? '',
      log.outcome ?? '',
      log.reasoning ?? '',
      guardrailText
    ];
  });

  return { headers, rows };
}

/**
 * Formats Recovery Opportunity records for CSV export.
 */
export function formatOpportunitiesForCSV(opportunities) {
  const headers = [
    'Transaction ID',
    'Customer ID',
    'Merchant ID',
    'Amount (INR)',
    'Payment Channel',
    'Bank / UPI App',
    'Status',
    'Decline Reason',
    'Retry Count',
    'Fraud Risk Score',
    'Recovery Probability',
    'Revenue at Risk (INR)',
    'Customer Success Rate',
    'Transaction Time'
  ];

  const rows = (opportunities || []).map((op) => [
    op.transaction_id ?? '',
    op.customer_id ?? '',
    op.merchant_id ?? '',
    op.amount !== undefined && op.amount !== null ? Number(op.amount).toFixed(2) : '0.00',
    op.payment_method ?? '',
    op.bank || op.upi_app || '—',
    op.status ?? '',
    op.failure_reason ?? '',
    op.retry_count ?? 0,
    op.fraud_score !== undefined && op.fraud_score !== null ? Number(op.fraud_score).toFixed(4) : '0.0000',
    op.recovery_probability !== undefined && op.recovery_probability !== null ? Number(op.recovery_probability).toFixed(4) : '0.0000',
    op.revenue_at_risk !== undefined && op.revenue_at_risk !== null ? Number(op.revenue_at_risk).toFixed(2) : '0.00',
    op.customer_success_rate !== undefined && op.customer_success_rate !== null ? Number(op.customer_success_rate).toFixed(4) : '',
    op.transaction_time ? new Date(op.transaction_time).toISOString() : ''
  ]);

  return { headers, rows };
}
