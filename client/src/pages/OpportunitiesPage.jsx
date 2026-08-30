import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Eye,
  Filter,
  CheckCircle2,
  RefreshCw,
  Crosshair,
  Target,
  Download,
  FileJson
} from 'lucide-react';
import { api } from '../services/api';
import {
  formatINR,
  formatPercentage,
  formatDateTime,
  getStatusBadge,
  getActionTypeColor
} from '../utils/formatters';
import {
  exportToCSV,
  exportToJSON,
  formatOpportunitiesForCSV,
  getExportFilename
} from '../utils/exportUtils';
import AnimatedNumber from '../components/AnimatedNumber';
import { KpiCardSkeleton, TableRowSkeleton } from '../components/SkeletonLoader';

export default function OpportunitiesPage({ onSelectTransaction, onOpenReviewModal }) {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterMode, setFilterMode] = useState('ALL');

  const fetchOpportunities = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getOpportunities();
      setOpportunities(res.opportunities || []);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch recovery opportunities');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const filteredList = opportunities.filter((op) => {
    if (filterMode === 'AUTOMATED') {
      return Number(op.fraud_score) < 0.7 && Number(op.amount) <= 50000 && Number(op.retry_count) < 2;
    }
    if (filterMode === 'HUMAN_REVIEW') {
      return Number(op.fraud_score) >= 0.7 || Number(op.amount) > 50000;
    }
    return true;
  });

  const handleExportCSV = () => {
    if (!filteredList || filteredList.length === 0) return;
    const { headers, rows } = formatOpportunitiesForCSV(filteredList);
    const filename = getExportFilename('recovery-opportunities', 'csv');
    exportToCSV(filename, headers, rows);
  };

  const handleExportJSON = () => {
    if (!filteredList || filteredList.length === 0) return;
    const filename = getExportFilename('recovery-opportunities', 'json');
    exportToJSON(filename, filteredList);
  };

  const totalValueAtRisk = opportunities.reduce(
    (acc, cur) => acc + (parseFloat(cur.revenue_at_risk) || 0),
    0
  );

  const avgProb =
    opportunities.length > 0
      ? opportunities.reduce((acc, cur) => acc + (parseFloat(cur.recovery_probability) || 0), 0) /
        opportunities.length
      : 0;

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Opportunities */}
        <div className="p-5 rounded-2xl hud-panel relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
            <span>Recovery Candidates</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono mt-2 group-hover:text-emerald-300 transition-colors">
            <AnimatedNumber value={opportunities.length} />
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">Prob &ge; 50% &bull; Retries &lt; 2 &bull; Fraud &lt; 0.70</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80" />
        </div>

        {/* Card 2: Recoverable Value at Risk */}
        <div className="p-5 rounded-2xl hud-panel relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
            <span>Recoverable Pool</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono mt-2 group-hover:text-cyan-300 transition-colors">
            <AnimatedNumber value={totalValueAtRisk} formatter={formatINR} />
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">Top 50 candidate cumulative volume</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-indigo-500 opacity-80" />
        </div>

        {/* Card 3: Avg Recovery Confidence */}
        <div className="p-5 rounded-2xl hud-panel relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-violet-400">
            <span>Mean Recovery Probability</span>
            <ShieldCheck className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono mt-2 group-hover:text-violet-300 transition-colors">
            <AnimatedNumber value={avgProb} formatter={formatPercentage} />
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">Multi-factor machine learning rating</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500 opacity-80" />
        </div>
      </div>

      {/* Candidate Classification Criteria Capsule */}
      <div className="p-3.5 rounded-xl bg-space-950/80 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center space-x-2 text-slate-300">
          <Target className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            <strong>Opportunity Qualification:</strong> Status = FAILED &bull; Recovery Probability &ge; 50% &bull; Retry Count &lt; 2 &bull; Fraud Score &lt; 0.70
          </span>
        </div>
        <div className="text-amber-400 text-[11px] font-bold">
          Revenue at Risk = Amount &times; Recovery Probability
        </div>
      </div>

      {/* Segment Selector & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl hud-panel">
        <div className="flex items-center space-x-2 font-mono">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            TARGET SECTOR:
          </span>
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'ALL'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/40'
                : 'bg-space-900 text-slate-400 hover:bg-space-850 border border-indigo-500/20'
            }`}
          >
            All Candidates ({opportunities.length})
          </button>
          <button
            onClick={() => setFilterMode('AUTOMATED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'AUTOMATED'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/40'
                : 'bg-space-900 text-slate-400 hover:bg-space-850 border border-indigo-500/20'
            }`}
          >
            Safe to Automate
          </button>
          <button
            onClick={() => setFilterMode('HUMAN_REVIEW')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'HUMAN_REVIEW'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 border border-amber-400/40'
                : 'bg-space-900 text-slate-400 hover:bg-space-850 border border-indigo-500/20'
            }`}
          >
            Operator Sign-Off Required
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={loading || filteredList.length === 0}
            title="Export recovery opportunities to CSV"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-space-900 hover:bg-space-850 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            disabled={loading || filteredList.length === 0}
            title="Export recovery opportunities to JSON"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-space-900 hover:bg-space-850 text-violet-400 hover:text-violet-300 border border-violet-500/30 text-xs font-mono font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>EXPORT JSON</span>
          </button>

          <button
            onClick={fetchOpportunities}
            className="p-2 rounded-xl bg-space-900 hover:bg-space-850 text-slate-300 hover:text-cyan-400 border border-indigo-500/30 transition-all"
            title="Refresh opportunity pool"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Cyber Table of Candidates */}
      <div className="rounded-2xl hud-panel overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-indigo-500/20 bg-space-950/90 text-[11px] font-mono uppercase tracking-wider text-slate-400 select-none">
                <th className="py-3.5 px-4">Transaction</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Decline Code</th>
                <th className="py-3.5 px-4">Recovery Probability</th>
                <th className="py-3.5 px-4">Revenue at Risk</th>
                <th className="py-3.5 px-4">Payment Channel</th>
                <th className="py-3.5 px-4">Guardrail Tier</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-500/10">
              {loading ? (
                <>
                  <TableRowSkeleton cols={8} />
                  <TableRowSkeleton cols={8} />
                  <TableRowSkeleton cols={8} />
                  <TableRowSkeleton cols={8} />
                  <TableRowSkeleton cols={8} />
                </>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-rose-400 font-mono">
                    {error}
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500 font-mono">
                    No recovery opportunities found for this segment.
                  </td>
                </tr>
              ) : (
                filteredList.map((op) => {
                  const isHighValue = Number(op.amount) > 50000;
                  const isHighFraud = Number(op.fraud_score) >= 0.7;
                  const needsReview = isHighValue || isHighFraud;

                  return (
                    <tr
                      key={op.transaction_id}
                      onClick={() => onSelectTransaction(op.transaction_id)}
                      className="hover:bg-space-800/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-white group-hover:text-cyan-400 transition-colors">
                          {op.transaction_id}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">{op.customer_id}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-white">
                          {formatINR(op.amount)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] font-bold text-rose-300">
                          {op.failure_reason}
                        </span>
                        <div className="text-[10px] font-mono text-slate-400">
                          Retries: {op.retry_count} / 2
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 h-1.5 rounded-full bg-space-950 overflow-hidden border border-indigo-500/20">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400"
                              style={{
                                width: `${Math.min(100, Number(op.recovery_probability || 0) * 100)}%`
                              }}
                            />
                          </div>
                          <span className="font-mono font-bold text-emerald-400 text-xs">
                            {formatPercentage(op.recovery_probability)}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {formatINR(op.revenue_at_risk)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">{op.payment_method}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {op.bank || (op.upi_app ? `UPI: ${op.upi_app}` : '—')}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {needsReview ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 animate-pulse">
                            <UserCheck className="w-3 h-3" />
                            OPERATOR REVIEW
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 className="w-3 h-3" />
                            SAFE TO RECOVER
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTransaction(op.transaction_id);
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
      </div>
    </div>
  );
}
