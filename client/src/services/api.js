const BASE_URL = import.meta.env.VITE_API_URL || '/api/recovery';

async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.message) {
        errorMsg = errorData.message;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  // Summary & Opportunities
  getSummary: () => fetch(`${BASE_URL}/summary`).then(handleResponse),
  getOpportunities: () => fetch(`${BASE_URL}/opportunities`).then(handleResponse),

  // Analytics
  getAnalyticsSummary: () => fetch(`${BASE_URL}/analytics/summary`).then(handleResponse),
  getPaymentMethodAnalytics: () => fetch(`${BASE_URL}/analytics/payment-methods`).then(handleResponse),
  getFailureReasonAnalytics: () => fetch(`${BASE_URL}/analytics/failure-reasons`).then(handleResponse),

  // Transactions list (search, filter, pagination)
  getTransactions: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return fetch(`${BASE_URL}/transactions?${query.toString()}`).then(handleResponse);
  },

  // Audit Logs
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return fetch(`${BASE_URL}/audit-logs?${query.toString()}`).then(handleResponse);
  },

  // Recovery Actions
  getRecoveryActions: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return fetch(`${BASE_URL}/actions?${query.toString()}`).then(handleResponse);
  },

  // Single Transaction Analyze
  analyzeTransaction: (transactionId) =>
    fetch(`${BASE_URL}/analyze/${encodeURIComponent(transactionId)}`).then(handleResponse),

  // Batch Analyze All Failed Transactions
  runBatchAnalysis: (limit = null) =>
    fetch(`${BASE_URL}/batch-analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(limit ? { limit } : {})
    }).then(handleResponse),

  // Human Review Submission
  submitHumanReview: (actionId, { decision, reviewer, reason }) =>
    fetch(`${BASE_URL}/human-review/${encodeURIComponent(actionId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, reviewer, reason })
    }).then(handleResponse),

  // Simulated Gateway Recovery Dispatch Execution
  executeRecoveryAction: (actionId, { dispatcher } = {}) =>
    fetch(`${BASE_URL}/execute/${encodeURIComponent(actionId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dispatcher })
    }).then(handleResponse)
};
