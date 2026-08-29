import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Clock,
  CreditCard,
  Building,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Shield,
  Zap,
  DollarSign,
  Activity,
  Lock,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';
import {
  formatINR,
  formatPercentage,
  formatDateTime,
  getStatusBadge,
  getActionTypeColor
} from '../utils/formatters';

export default function TransactionDetailModal({
  transactionId,
  isOpen,
  onClose,
  onOpenReviewModal
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !transactionId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    api.analyzeTransaction(transactionId)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to analyze transaction');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, transactionId]);

  if (!isOpen) return null;

  const tx = data?.transaction;
  const agent = data?.agent_decision;
  const guardrails = data?.guardrail_decision;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div
        className="bg-[#060b1e] border border-cyan-500/30 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-cyan-950/60 relative modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-400" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-indigo-500/20 flex items-center justify-between bg-space-950/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-base font-black text-white tracking-wider">
                  {transactionId}
                </span>
                {tx && (
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      getStatusBadge(tx.status).bg
                    }`}
                  >
                    {tx.status}
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-cyan-300/80">AI Telemetry & Guardrail Validation Console</p>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3 font-mono">
              <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-cyan-300 font-semibold uppercase tracking-wider">
                Synthesizing multi-factor telemetry...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-mono">
              <p className="font-bold">Telemetry Query Failed</p>
              <p className="text-xs text-rose-300/80 mt-1">{error}</p>
            </div>
          ) : (
            <>
              {/* Transaction Key Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl hud-panel">
                  <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    Amount
                  </div>
                  <div className="text-lg font-black text-white font-mono mt-1">
                    {formatINR(tx.amount)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl hud-panel">
                  <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                    Channel
                  </div>
                  <div className="text-sm font-semibold text-white mt-1">
                    {tx.payment_method}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl hud-panel">
                  <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    Fraud Score
                  </div>
                  <div className="text-base font-bold text-white font-mono mt-1 flex items-center gap-1">
                    {tx.fraud_score}
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        Number(tx.fraud_score) < 0.3
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : Number(tx.fraud_score) < 0.7
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-rose-500/15 text-rose-400'
                      }`}
                    >
                      {Number(tx.fraud_score) < 0.3 ? 'LOW' : Number(tx.fraud_score) < 0.7 ? 'MED' : 'HIGH'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl hud-panel">
                  <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    Recovery Prob
                  </div>
                  <div className="text-base font-bold text-emerald-400 font-mono mt-1">
                    {formatPercentage(tx.recovery_probability)}
                  </div>
                </div>
              </div>

              {/* Successful Transaction Information Banner */}
              {tx.status !== 'FAILED' ? (
                <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 text-sm font-bold font-mono">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Transaction Settled Successfully</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    This transaction was authorized and settled without failure. Multi-factor recovery models and guardrail safety escalations apply strictly to failed payment events.
                  </p>
                </div>
              ) : (
                <>
                  {/* Failure Reason Banner */}
                  {tx.failure_reason && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-mono font-bold text-rose-300">Decline Code: </span>
                          <span className="text-xs font-mono font-black text-rose-400">{tx.failure_reason}</span>
                        </div>
                      </div>
                      <div className="text-xs font-mono text-slate-400">
                        Retry Count: <span className="font-bold text-white">{tx.retry_count} / 2</span>
                      </div>
                    </div>
                  )}

                  {/* AI Recovery Agent Recommendation */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-space-900 via-space-850 to-space-950 border border-cyan-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs">
                          AI
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono">
                            Multi-Factor Recovery Strategy
                          </h4>
                          <p className="text-[11px] text-slate-400">Autonomous machine intelligence evaluation</p>
                        </div>
                      </div>

                      {agent && (
                        <span
                          className={`text-xs font-bold font-mono px-3 py-1 rounded-lg border ${
                            getActionTypeColor(agent.decision)
                          }`}
                        >
                          {agent.decision}
                        </span>
                      )}
                    </div>

                    {agent && (
                      <>
                        <p className="text-xs font-mono text-slate-200 leading-relaxed bg-space-950/80 p-3 rounded-lg border border-indigo-500/20">
                          "{agent.reason}"
                        </p>

                        {/* Mathematical Formula Telemetry */}
                        <div className="p-2.5 rounded-lg bg-space-950/90 border border-cyan-500/20 text-[10px] font-mono text-slate-300 space-y-1">
                          <div className="text-cyan-400 font-bold uppercase">Mathematical Scoring Model:</div>
                          <div className="text-slate-400">
                            P(recovery) = BaseProb({tx.failure_reason}) &times; (1 - 0.25&times;Retries({tx.retry_count})) &times; (1 - 0.40&times;Fraud({tx.fraud_score}))
                          </div>
                          <div className="text-emerald-400 font-bold">
                            &rarr; Calculated Recovery Probability: {formatPercentage(tx.recovery_probability)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 font-mono">
                          <span className="text-slate-400">Model Confidence:</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 h-2 rounded-full bg-space-950 overflow-hidden border border-indigo-500/20">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                                style={{ width: `${Math.min(100, (agent.confidence || 0) * 100)}%` }}
                              />
                            </div>
                            <span className="font-bold text-white">
                              {formatPercentage(agent.confidence)}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Guardrail Safety Sentinel Validation */}
                  <div className="p-4 rounded-xl hud-panel space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-emerald-400" />
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                            Guardrail Security Sentinel (5 Checks)
                          </h4>
                          <p className="text-[11px] text-slate-400">Deterministic zero-hallucination safety barrier</p>
                        </div>
                      </div>

                      {guardrails && (
                        <div className="flex items-center gap-2 font-mono">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                              guardrails.allowed
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                                : 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                            }`}
                          >
                            {guardrails.allowed ? '✓ EXECUTION ALLOWED' : '🔒 EXECUTION BLOCKED'}
                          </span>
                          {guardrails.escalationRequired && (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                              ⚠ ESCALATED
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Individual Guardrail Rules Breakdown */}
                    {guardrails?.checks && (
                      <div className="space-y-2 pt-2">
                        <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                          Policy Enforcement Telemetry
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                          {guardrails.checks.map((check, idx) => (
                            <div
                              key={idx}
                              className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                                check.passed
                                  ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-200'
                                  : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                {check.passed ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                                )}
                                <div>
                                  <span className="text-[11px] font-medium block">{check.rule}</span>
                                  <span className="text-[9px] text-slate-400 font-sans block">{check.detail || check.reason}</span>
                                </div>
                              </div>
                              <span
                                className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0 ml-2 ${
                                  check.passed
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-rose-500/20 text-rose-400'
                                }`}
                              >
                                {check.passed ? 'PASSED' : 'BLOCKED'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-indigo-500/20 bg-space-950/90 flex items-center justify-between">
          <div className="text-xs font-mono text-slate-400">
            Engine Policy: <span className="text-cyan-400 font-bold">100% Deterministic</span>
          </div>

          <div className="flex items-center space-x-3 font-mono">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-space-900 hover:bg-space-850 text-slate-300 text-xs font-bold border border-indigo-500/20 transition-colors"
            >
              CLOSE CONSOLE
            </button>
            {data?.action_id && guardrails?.escalationRequired && (
              <button
                onClick={() => {
                  onClose();
                  onOpenReviewModal(data.action_id, transactionId);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 border border-amber-400/40 transition-all"
              >
                OPEN SIGN-OFF
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
