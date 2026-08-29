import React, { useState } from 'react';
import {
  X,
  UserCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  ShieldCheck,
  Radio,
  Lock
} from 'lucide-react';
import { api } from '../services/api';

export default function HumanReviewModal({
  actionId,
  transactionId,
  isOpen,
  onClose,
  onSuccess
}) {
  const [decision, setDecision] = useState('APPROVE'); // 'APPROVE' or 'REJECT'
  const [reviewer, setReviewer] = useState('RiskOfficer_Lead');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A deliberate auditable reason is required for compliance.');
      return;
    }
    if (!reviewer.trim()) {
      setError('Operator / Reviewer name is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.submitHumanReview(actionId, {
        decision,
        reviewer: reviewer.trim(),
        reason: reason.trim()
      });

      setSubmitting(false);
      if (onSuccess) onSuccess(res);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit operator decision');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div
        className="bg-[#060b1e] border border-amber-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-amber-950/40 flex flex-col relative modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-[2px] w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-indigo-500/20 flex items-center justify-between bg-space-950/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white font-mono uppercase tracking-wide">
                Operator Sign-Off Console
              </h3>
              <p className="text-xs font-mono text-amber-300/80">
                Action #{actionId} &bull; Ref: {transactionId}
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 font-mono">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Decision Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Select Operator Decision:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision('APPROVE')}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center space-x-2 transition-all ${
                  decision === 'APPROVE'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/20 font-black'
                    : 'bg-space-900/80 border-indigo-500/20 text-slate-400 hover:bg-space-850'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>APPROVE STRATEGY</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('REJECT')}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center space-x-2 transition-all ${
                  decision === 'REJECT'
                    ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-lg shadow-rose-500/20 font-black'
                    : 'bg-space-900/80 border-indigo-500/20 text-slate-400 hover:bg-space-850'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>REJECT / TERMINATE</span>
              </button>
            </div>
          </div>

          {/* Reviewer Identifier */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Operator Sign-Off Authority:
            </label>
            <input
              type="text"
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
              placeholder="e.g. RiskOfficer_Dave"
              className="w-full px-3.5 py-2.5 rounded-xl bg-space-950/90 border border-indigo-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              required
            />
          </div>

          {/* Reason Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Auditable Justification Notes:
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide reason for approval or rejection (logged permanently to audit trail)..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-space-950/90 border border-indigo-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors font-sans"
              required
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-space-900 hover:bg-space-850 text-slate-300 text-xs font-bold border border-indigo-500/20 transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-white text-xs font-black shadow-lg transition-all ${
                decision === 'APPROVE'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25 border border-emerald-400/40'
                  : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-500/25 border border-rose-400/40'
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>RECORDING SIGN-OFF...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>COMMIT {decision}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
