// Utility formatters for RecoverAI

export function formatINR(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  const num = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: num >= 1000 ? 0 : 2
  }).format(num);
}

export function formatNumber(num) {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
}

export function formatPercentage(val) {
  if (val === undefined || val === null || isNaN(val)) return '0%';
  const num = Number(val);
  return `${(num > 1 ? num : num * 100).toFixed(1)}%`;
}

export function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return isoString;
  }
}

export function getStatusBadge(status) {
  switch ((status || '').toUpperCase()) {
    case 'SUCCESS':
    case 'APPROVED':
    case 'ACTION_APPROVED':
    case 'APPROVED_BY_HUMAN':
      return {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-400',
        label: status
      };
    case 'FAILED':
    case 'BLOCKED':
    case 'ACTION_BLOCKED':
      return {
        bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        dot: 'bg-rose-400',
        label: status
      };
    case 'REJECTED':
    case 'ACTION_REJECTED':
    case 'REJECTED_BY_HUMAN':
      return {
        bg: 'bg-red-500/10 text-red-400 border-red-500/30',
        dot: 'bg-red-400',
        label: status
      };
    case 'HUMAN_REVIEW':
    case 'PENDING_REVIEW':
      return {
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-400',
        label: 'HUMAN REVIEW'
      };
    default:
      return {
        bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
        dot: 'bg-slate-400',
        label: status || 'UNKNOWN'
      };
  }
}

export function getActionTypeColor(actionType) {
  switch ((actionType || '').toUpperCase()) {
    case 'RETRY_PAYMENT':
    case 'WAIT_AND_RETRY':
      return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
    case 'SEND_PAYMENT_LINK':
      return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
    case 'CHANGE_PAYMENT_METHOD':
      return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
    case 'HUMAN_REVIEW':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    case 'DO_NOT_RECOVER':
      return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    default:
      return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
  }
}
