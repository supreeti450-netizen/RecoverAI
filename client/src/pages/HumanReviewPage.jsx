import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Check,
  Inbox,
  Shield,
  Radio,
  Lock
} from 'lucide-react';
import { api } from '../services/api';
import {
  formatINR,
  formatPercentage,
  formatDateTime,
  getActionTypeColor
} from '../utils/formatters';

export default function HumanReviewPage({
  onSelectTransaction,
  onOpenReviewModal,
  refreshTrigger
}) {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  const fetchHumanReviewQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getRecoveryActions({
        requires_human: true,
        limit: 50
      });
      setActions(res.data || []);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch human review queue');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHumanReviewQueue();
  }, [refreshTrigger]);

  const handleQuickApprove = (action) => {
    onOpenReviewModal(action.action_id, action.transaction_id);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-lg animate-fadeIn font-mono">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Header Metric & Information Console */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-space-900 to-space-900 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-white font-mono tracking-wide uppercase">
                Operator Sign-Off Station
              </h2>
              <span className="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {actions.length} PENDING DECISIONS
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Deterministic guardrail safety barriers flagged high-risk or high-value actions for mandatory operator sign-off.
            </p>
          </div>
        </div>

        <button
          onClick={fetchHumanReviewQueue}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-space-900 hover:bg-space-850 text-slate-300 text-xs font-mono font-bold border border-indigo-500/30 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>REFRESH QUEUE</span>
        </button>
      </div>

      {/* Escalation Policy Guide Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
        <div className="p-3 rounded-xl bg-space-950/80 border border-amber-500/20 flex items-center space-x-2.5">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <div className="text-slate-300 text-[11px]">
            <strong>Trigger 1:</strong> Amount &gt; ₹50,000 (High exposure)
          </div>
        </div>
        <div className="p-3 rounded-xl bg-space-950/80 border border-amber-500/20 flex items-center space-x-2.5">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <div className="text-slate-300 text-[11px]">
            <strong>Trigger 2:</strong> Fraud Score &ge; 0.70 (Risk threshold)
          </div>
        </div>
        <div className="p-3 rounded-xl bg-space-950/80 border border-amber-500/20 flex items-center space-x-2.5">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <div className="text-slate-300 text-[11px]">
            <strong>Trigger 3:</strong> AI Confidence &lt; 0.75 (Low certainty)
          </div>
        </div>
      </div>

      {/* Queue Items */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3 font-mono">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Scanning escalation queue...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-mono">
          {error}
        </div>
      ) : actions.length === 0 ? (
        <div className="py-24 rounded-2xl hud-panel flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white font-mono uppercase">Escalation Queue Clear</h3>
          <p className="text-xs text-slate-400 max-w-md">
            All flagged actions have been reviewed and resolved. Automated multi-factor execution is running autonomously.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map((act) => (
            <div
              key={act.action_id}
              className="p-5 rounded-2xl hud-panel guardrail-escalate-pulse hover:border-amber-500/50 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header: Action ID + Transaction ID */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-black text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                      ACTION #{act.action_id}
                    </span>
                    <button
                      onClick={() => onSelectTransaction(act.transaction_id)}
                      className="font-mono text-xs font-bold text-white hover:text-cyan-300 transition-colors flex items-center gap-1"
                    >
                      {act.transaction_id}
                      <Eye className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>

                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 animate-pulse">
                    MANDATORY SIGN-OFF
                  </span>
                </div>

                {/* Proposed Strategy & AI Confidence */}
                <div className="p-3 rounded-xl bg-space-950/80 border border-indigo-500/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">Proposed Strategy:</span>
                    <span
                      className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${
                        getActionTypeColor(act.action_type)
                      }`}
                    >
                      {act.action_type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">Model Confidence:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatPercentage(act.confidence)}
                    </span>
                  </div>
                </div>

                {/* Escalation Trigger Rationale */}
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Guardrail Trigger Rationale:
                  </span>
                  <p className="text-xs text-slate-200 bg-space-950/60 p-3 rounded-lg border border-indigo-500/15 leading-relaxed font-mono">
                    {act.reason || 'Guardrail confidence threshold check flagged for manual sign-off.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-indigo-500/20 flex items-center justify-between gap-3">
                <button
                  onClick={() => onSelectTransaction(act.transaction_id)}
                  className="px-3.5 py-2 rounded-xl bg-space-900 hover:bg-space-850 text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5 border border-indigo-500/20 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>INSPECT</span>
                </button>

                <button
                  onClick={() => handleQuickApprove(act)}
                  className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black font-mono flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/25 border border-amber-400/40 transition-all transform hover:-translate-y-0.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>AUTHORIZE OR REJECT</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
