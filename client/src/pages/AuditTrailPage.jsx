import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  UserCheck,
  Activity,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileCheck,
  Lock,
  Terminal,
  Download,
  FileJson
} from 'lucide-react';
import { api } from '../services/api';
import {
  formatDateTime,
  getStatusBadge,
  getActionTypeColor
} from '../utils/formatters';
import {
  exportToCSV,
  exportToJSON,
  formatAuditLogsForCSV,
  getExportFilename
} from '../utils/exportUtils';
import { TableRowSkeleton } from '../components/SkeletonLoader';

export default function AuditTrailPage({ onSelectTransaction }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [transactionId, setTransactionId] = useState('');
  const [eventType, setEventType] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Expanded row state for guardrail inspection
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAuditLogs({
        transaction_id: transactionId || undefined,
        event_type: eventType || undefined,
        page,
        limit
      });

      setLogs(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotalRecords(res.total || 0);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch audit trail');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, eventType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAuditLogs();
  };

  const toggleExpand = (logId) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  const handleExportCSV = () => {
    if (!logs || logs.length === 0) return;
    const { headers, rows } = formatAuditLogsForCSV(logs);
    const filename = getExportFilename('audit-log', 'csv');
    exportToCSV(filename, headers, rows);
  };

  const handleExportJSON = () => {
    if (!logs || logs.length === 0) return;
    const filename = getExportFilename('audit-log', 'json');
    exportToJSON(filename, logs);
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-16">
      {/* Controls Bar: Search, Filter & Compliance Export */}
      <div className="p-4 rounded-2xl hud-panel space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Search Transaction ID (e.g. RP000003)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-space-950/80 border border-indigo-500/30 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <select
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-space-950/80 border border-indigo-500/30 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Event Classes</option>
              <option value="RECOVERY_ANALYSIS">AI Recovery Analysis</option>
              <option value="HUMAN_REVIEW">Operator Review Decisions</option>
            </select>

            <button
              onClick={handleExportCSV}
              disabled={loading || logs.length === 0}
              title="Export compliance audit records to CSV"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-space-900 hover:bg-space-850 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT CSV</span>
            </button>

            <button
              onClick={handleExportJSON}
              disabled={loading || logs.length === 0}
              title="Export structured compliance audit trail to JSON"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-space-900 hover:bg-space-850 text-violet-400 hover:text-violet-300 border border-violet-500/30 text-xs font-mono font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>EXPORT JSON</span>
            </button>

            <button
              onClick={fetchAuditLogs}
              title="Refresh audit trail"
              className="p-2 rounded-xl bg-space-900 hover:bg-space-850 text-slate-300 hover:text-cyan-400 border border-indigo-500/30 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Compliance Architecture Capsule */}
      <div className="p-3.5 rounded-xl bg-space-950/80 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center space-x-2 text-slate-300">
          <FileCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>
            <strong>Immutable Compliance Logging:</strong> All automated agent determinations and human sign-offs record actor, reasoning, and full guardrail checks.
          </span>
        </div>
        <div className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>Non-Repudiation Guaranteed</span>
        </div>
      </div>

      {/* Cyber Audit Log Table */}
      <div className="rounded-2xl hud-panel overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-indigo-500/20 bg-space-950/90 text-[11px] font-mono uppercase tracking-wider text-slate-400 select-none">
                <th className="py-3.5 px-4">Event # & Timestamp</th>
                <th className="py-3.5 px-4">Transaction Reference</th>
                <th className="py-3.5 px-4">Event Type</th>
                <th className="py-3.5 px-4">Actor Attribution</th>
                <th className="py-3.5 px-4">Decision Strategy</th>
                <th className="py-3.5 px-4">Outcome</th>
                <th className="py-3.5 px-4 text-right">Telemetry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-500/10">
              {loading ? (
                <>
                  <TableRowSkeleton cols={7} />
                  <TableRowSkeleton cols={7} />
                  <TableRowSkeleton cols={7} />
                  <TableRowSkeleton cols={7} />
                  <TableRowSkeleton cols={7} />
                </>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-rose-400 font-mono">
                    {error}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500 font-mono">
                    No compliance records found matching query parameters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedLogId === log.log_id;
                  const isHuman = log.event_type === 'HUMAN_REVIEW';

                  return (
                    <React.Fragment key={log.log_id}>
                      <tr
                        onClick={() => toggleExpand(log.log_id)}
                        className={`hover:bg-space-800/50 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-space-800/40' : ''
                        }`}
                      >
                        {/* Log ID & Timestamp */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-200">
                            #{log.log_id}
                          </span>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {formatDateTime(log.created_at)}
                          </div>
                        </td>

                        {/* Transaction ID */}
                        <td className="py-3.5 px-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTransaction(log.transaction_id);
                            }}
                            className="font-mono font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                          >
                            <span>{log.transaction_id}</span>
                            <Eye className="w-3 h-3 text-slate-500" />
                          </button>
                          {log.action_id && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              Action #{log.action_id}
                            </div>
                          )}
                        </td>

                        {/* Event Type */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                              isHuman
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                                : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                            }`}
                          >
                            {log.event_type}
                          </span>
                        </td>

                        {/* Actor */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1.5 font-mono">
                            {isHuman ? (
                              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <Activity className="w-3.5 h-3.5 text-cyan-400" />
                            )}
                            <span className="font-semibold text-slate-200">{log.actor}</span>
                          </div>
                        </td>

                        {/* Decision */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                              getActionTypeColor(log.decision)
                            }`}
                          >
                            {log.decision}
                          </span>
                        </td>

                        {/* Outcome */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                              getStatusBadge(log.outcome).bg
                            }`}
                          >
                            {log.outcome}
                          </span>
                        </td>

                        {/* Toggle Expand Icon */}
                        <td className="py-3.5 px-4 text-right">
                          <button className="p-1 rounded text-slate-400 hover:text-white">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Details Drawer */}
                      {isExpanded && (
                        <tr className="bg-space-950/90 border-b border-indigo-500/20">
                          <td colSpan={7} className="p-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                              {/* Left: Auditable Reasoning */}
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Auditable Reasoning Telemetry:
                                </span>
                                <p className="text-slate-200 bg-space-900/90 p-3 rounded-xl border border-indigo-500/20 leading-relaxed font-sans text-xs">
                                  {log.reasoning || 'No additional reasoning recorded.'}
                                </p>
                              </div>

                              {/* Right: Guardrails / Checklist payload */}
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Guardrail Safety Telemetry:
                                </span>
                                <div className="bg-space-900/90 p-3 rounded-xl border border-indigo-500/20 text-[11px] text-slate-300 max-h-40 overflow-y-auto">
                                  {Array.isArray(log.guardrails_checked) ? (
                                    <div className="space-y-1.5">
                                      {log.guardrails_checked.map((gc, i) => (
                                        <div key={i} className="flex items-center justify-between border-b border-indigo-500/10 pb-1">
                                          <span className="text-slate-300">{gc.rule}:</span>
                                          <span
                                            className={
                                              gc.passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'
                                            }
                                          >
                                            {gc.passed ? '✓ PASSED' : '✕ FAILED'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <pre className="whitespace-pre-wrap font-mono text-[10px]">
                                      {typeof log.guardrails_checked === 'object'
                                        ? JSON.stringify(log.guardrails_checked, null, 2)
                                        : log.guardrails_checked || 'None recorded'}
                                    </pre>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
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
