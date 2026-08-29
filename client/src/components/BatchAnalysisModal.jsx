import React, { useState } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Users,
  Cpu,
  Radio,
  Activity
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR } from '../utils/formatters';

export default function BatchAnalysisModal({
  isOpen,
  onClose,
  onAnalysisComplete
}) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleRunBatch = async () => {
    setRunning(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.runBatchAnalysis();
      setResult(res.summary);
      setRunning(false);
      if (onAnalysisComplete) {
        onAnalysisComplete(res.summary);
      }
    } catch (err) {
      setError(err.message || 'Batch analysis failed');
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div
        className="bg-[#060b1e] border border-cyan-500/40 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl shadow-cyan-950/50 flex flex-col relative modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-[2px] w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-500" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-indigo-500/20 flex items-center justify-between bg-space-950/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-white font-mono uppercase tracking-wide">
                Autonomous Batch Analysis Mission
              </h3>
              <p className="text-xs font-mono text-cyan-300/80">
                Execute AI decision pipeline & guardrail validation across all failed transactions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-space-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 font-mono">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {!result ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-space-950/80 border border-indigo-500/20 space-y-3">
                <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                  <Activity className="w-4 h-4" />
                  <span>Pipeline Execution Telemetry</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside font-sans">
                  <li>Ingests unanalyzed failed payment events from PostgreSQL.</li>
                  <li>Synthesizes multi-factor machine learning recovery probability models.</li>
                  <li>Enforces 5 deterministic safety guardrails (fraud, retries, value, confidence).</li>
                  <li>Atomically commits recovery actions & immutable compliance audit trail.</li>
                </ul>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={running}
                  className="px-4 py-2 rounded-xl bg-space-900 hover:bg-space-850 text-slate-300 text-xs font-bold border border-indigo-500/20 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleRunBatch}
                  disabled={running}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-violet-500 text-white text-xs font-black shadow-lg shadow-cyan-500/25 border border-cyan-400/40 transition-all disabled:opacity-50"
                >
                  {running ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>EXECUTING PIPELINE...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      <span>LAUNCH BATCH MISSION</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-300 uppercase">Mission Execution Complete</h4>
                  <p className="text-xs text-emerald-200/80 font-sans">
                    Successfully processed and categorized failed payment transactions.
                  </p>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl hud-panel">
                  <div className="text-slate-400">Total Failures</div>
                  <div className="text-base font-black text-white mt-0.5">
                    {result.total_failed_transactions}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl hud-panel">
                  <div className="text-slate-400">Newly Evaluated</div>
                  <div className="text-base font-black text-cyan-400 mt-0.5">
                    {result.newly_analyzed}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl hud-panel">
                  <div className="text-slate-400">Approved Targets</div>
                  <div className="text-base font-black text-emerald-400 mt-0.5">
                    {result.approved_opportunities}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl hud-panel">
                  <div className="text-slate-400">Operator Escalations</div>
                  <div className="text-base font-black text-amber-400 mt-0.5">
                    {result.human_review_cases}
                  </div>
                </div>
              </div>

              {/* Estimated Recoverable Revenue */}
              <div className="p-3.5 rounded-xl bg-space-950/80 border border-indigo-500/20 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-slate-300">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Estimated Recoverable Volume:</span>
                </div>
                <div className="text-sm font-black text-emerald-400">
                  {formatINR(result.estimated_recoverable_revenue)}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black shadow-lg shadow-cyan-500/25 border border-cyan-400/40"
                >
                  DONE & REFRESH TELEMETRY
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
