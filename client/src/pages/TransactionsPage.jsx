import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
  Sparkles,
  Shield,
  UserCheck,
  RefreshCw,
  Terminal,
  Activity,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import {
  formatINR,
  formatPercentage,
  formatDateTime,
  getStatusBadge,
  getActionTypeColor
} from '../utils/formatters';
import { TableRowSkeleton } from '../components/SkeletonLoader';

export default function TransactionsPage({ onSelectTransaction }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [requiresHuman, setRequiresHuman] = useState('');
  const [sortBy, setSortBy] = useState('transaction_id');
  const [sortOrder, setSortOrder] = useState('ASC');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTransactions({
        search,
        status: status || undefined,
        payment_method: paymentMethod || undefined,
        failure_reason: failureReason || undefined,
        requires_human: requiresHuman || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        limit
      });

      setTransactions(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotalRecords(res.total || 0);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to load transactions');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, status, paymentMethod, failureReason, requiresHuman, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleSortToggle = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('DESC');
    }
    setPage(1);
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-16">
      {/* Controls Bar: Search & Quick Filters */}
      <div className="p-4 rounded-2xl hud-panel space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, merchant, customer, bank..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-space-950/80 border border-indigo-500/30 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
            />
          </form>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-space-950/80 border border-indigo-500/30 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Statuses</option>
              <option value="FAILED">Failed Only</option>
              <option value="SUCCESS">Settled (Success)</option>
            </select>

            {/* Payment Method Filter */}
            <select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-space-950/80 border border-indigo-500/30 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Payment Channels</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="NETBANKING">Netbanking</option>
              <option value="WALLET">Wallet</option>
            </select>

            {/* Failure Reason Filter */}
            <select
              value={failureReason}
              onChange={(e) => {
                setFailureReason(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-space-950/80 border border-indigo-500/30 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Failure Codes</option>
              <option value="UPI_TIMEOUT">UPI Timeout</option>
              <option value="BANK_DECLINED">Bank Declined</option>
              <option value="INSUFFICIENT_FUNDS">Insufficient Funds</option>
              <option value="NETWORK_ERROR">Network Error</option>
              <option value="PAYMENT_TIMEOUT">Payment Timeout</option>
              <option value="CARD_DECLINED">Card Declined</option>
            </select>

            {/* Human Review Requirement Filter */}
            <select
              value={requiresHuman}
              onChange={(e) => {
                setRequiresHuman(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-space-950/80 border border-indigo-500/30 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="">Escalations: All</option>
              <option value="true">Requires Human (Yes)</option>
              <option value="false">Automated (No)</option>
            </select>

            {/* Refresh */}
            <button
              onClick={fetchTransactions}
              title="Refresh results"
              className="p-2 rounded-xl bg-space-900 hover:bg-space-850 text-slate-300 hover:text-cyan-400 border border-indigo-500/30 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Active Filter Badges Counter */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-indigo-500/10">
          <div>
            Stream Ingestion:{' '}
            <span className="font-bold text-white font-mono">{transactions.length}</span> of{' '}
            <span className="font-bold text-cyan-400 font-mono">{totalRecords}</span> transactions
          </div>
          <div className="flex items-center space-x-2 font-mono">
            <span>SORT:</span>
            <button
              onClick={() => handleSortToggle('amount')}
              className={`px-2 py-0.5 rounded border text-[11px] font-bold transition-colors ${
                sortBy === 'amount'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-space-900 text-slate-400 border-space-800'
              }`}
            >
              Amount {sortBy === 'amount' && (sortOrder === 'DESC' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => handleSortToggle('recovery_probability')}
              className={`px-2 py-0.5 rounded border text-[11px] font-bold transition-colors ${
                sortBy === 'recovery_probability'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-space-900 text-slate-400 border-space-800'
              }`}
            >
              Recovery Score {sortBy === 'recovery_probability' && (sortOrder === 'DESC' ? '↓' : '↑')}
            </button>
          </div>
        </div>
      </div>

      {/* Cyber Table Container */}
      <div className="rounded-2xl hud-panel overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-indigo-500/20 bg-space-950/90 text-[11px] font-mono uppercase tracking-wider text-slate-400 select-none">
                <th className="py-3.5 px-4">Transaction Identity</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Method & Route</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Decline Code</th>
                <th className="py-3.5 px-4">AI Recommendation</th>
                <th className="py-3.5 px-4">Recovery Score</th>
                <th className="py-3.5 px-4">Guardrail Mode</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-500/10 font-sans">
              {loading ? (
                <>
                  <TableRowSkeleton cols={9} />
                  <TableRowSkeleton cols={9} />
                  <TableRowSkeleton cols={9} />
                  <TableRowSkeleton cols={9} />
                  <TableRowSkeleton cols={9} />
                </>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-rose-400 font-mono">
                    {error}
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-500 font-mono">
                    No transactions matching telemetry criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const badge = getStatusBadge(tx.status);
                  return (
                    <tr
                      key={tx.transaction_id}
                      onClick={() => onSelectTransaction(tx.transaction_id)}
                      className="hover:bg-space-800/50 transition-colors cursor-pointer group"
                    >
                      {/* Transaction ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                          <span className="font-mono font-bold text-white group-hover:text-cyan-400 transition-colors">
                            {tx.transaction_id}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {tx.customer_id}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-white">
                          {formatINR(tx.amount)}
                        </div>
                        {tx.revenue_at_risk > 0 && (
                          <div className="text-[10px] text-amber-400 font-mono">
                            Risk: {formatINR(tx.revenue_at_risk)}
                          </div>
                        )}
                      </td>

                      {/* Method & Bank */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">{tx.payment_method}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {tx.bank || (tx.upi_app ? `UPI: ${tx.upi_app}` : '—')}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${badge.bg}`}
                        >
                          {tx.status}
                        </span>
                      </td>

                      {/* Decline Code */}
                      <td className="py-3.5 px-4">
                        {tx.failure_reason ? (
                          <div>
                            <span className="font-mono text-[11px] font-bold text-rose-300">
                              {tx.failure_reason}
                            </span>
                            <div className="text-[10px] font-mono text-slate-400">
                              Retry: {tx.retry_count} / 2
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono">—</span>
                        )}
                      </td>

                      {/* AI Recommendation */}
                      <td className="py-3.5 px-4">
                        {tx.status !== 'FAILED' ? (
                          <span className="text-slate-500 font-mono text-[11px]">—</span>
                        ) : tx.action_type ? (
                          <div>
                            <span
                              className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                                getActionTypeColor(tx.action_type)
                              }`}
                            >
                              {tx.action_type}
                            </span>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              Conf: {formatPercentage(tx.action_confidence || tx.recovery_probability)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic font-mono">Not Analyzed</span>
                        )}
                      </td>

                      {/* Recovery Probability */}
                      <td className="py-3.5 px-4">
                        {tx.status === 'FAILED' ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-12 h-1.5 rounded-full bg-space-950 overflow-hidden border border-indigo-500/20">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                                style={{ width: `${Math.min(100, Number(tx.recovery_probability || 0) * 100)}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-emerald-400 text-xs">
                              {formatPercentage(tx.recovery_probability)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* Guardrail Mode / Human Review */}
                      <td className="py-3.5 px-4">
                        {tx.status === 'FAILED' && tx.requires_human ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 animate-pulse">
                            <UserCheck className="w-3 h-3" />
                            ESCALATED
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400">
                            {tx.status === 'SUCCESS' ? '—' : 'Automated'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTransaction(tx.transaction_id);
                          }}
                          className="p-1.5 rounded-lg bg-space-900 hover:bg-cyan-600 text-slate-400 hover:text-white border border-indigo-500/20 hover:border-cyan-400 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Cyber Pagination Bar */}
        <div className="p-4 border-t border-indigo-500/20 bg-space-950/90 flex items-center justify-between text-xs font-mono text-slate-400">
          <div>
            PAGE <span className="font-bold text-cyan-400">{page}</span> OF{' '}
            <span className="font-bold text-white">{totalPages}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-space-900 hover:bg-space-850 text-slate-300 border border-indigo-500/20 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>PREV</span>
            </button>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-space-900 hover:bg-space-850 text-slate-300 border border-indigo-500/20 disabled:opacity-30 transition-colors"
            >
              <span>NEXT</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
