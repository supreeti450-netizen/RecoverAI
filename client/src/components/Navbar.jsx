import React from 'react';
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Shield,
  Activity,
  User,
  Radio,
  Terminal
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

const TAB_TITLES = {
  overview: {
    title: 'Command Center',
    code: 'SYS_OVERVIEW // RECOVERY TOWER',
    subtitle: 'Real-time payment failure intelligence & revenue recovery control tower'
  },
  transactions: {
    title: 'Telemetry Stream',
    code: 'DATA_STREAM // INGESTION LOG',
    subtitle: 'High-density inspection & multi-attribute transaction intelligence'
  },
  opportunities: {
    title: 'Recovery Targets',
    code: 'RECOVERY_POOL // YIELD MATRIX',
    subtitle: 'High-probability failed payment recovery candidate classification'
  },
  'human-review': {
    title: 'Operator Escalations',
    code: 'HUMAN_IN_LOOP // REVIEW QUEUE',
    subtitle: 'Mandatory guardrail escalation queue awaiting operator sign-off'
  },
  analytics: {
    title: 'Revenue Intelligence',
    code: 'ANALYTICS // DECISION MODELS',
    subtitle: 'Cross-channel decline pattern analytics & AI recovery performance'
  },
  'audit-trail': {
    title: 'Immutable Audit Log',
    code: 'COMPLIANCE // HASHED TIMELINE',
    subtitle: 'Cryptographically ordered compliance record of all AI and human decisions'
  }
};

export default function Navbar({
  activeTab,
  stats,
  onRefresh,
  isRefreshing,
  onOpenBatchModal
}) {
  const currentTab = TAB_TITLES[activeTab] || TAB_TITLES.overview;

  return (
    <header className="h-18 px-6 bg-[#05091a]/90 border-b border-indigo-500/20 flex items-center justify-between backdrop-blur-xl z-20 select-none shadow-lg shadow-black/40">
      {/* Left: Dynamic Title & HUD Telemetry */}
      <div className="flex items-center space-x-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-base font-black text-white font-mono tracking-wide uppercase">
              {currentTab.title}
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-cyan-400 border border-indigo-500/30">
              {currentTab.code}
            </span>
          </div>
          <p className="text-xs text-slate-400 truncate max-w-lg hidden md:block">
            {currentTab.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Live Telemetry Capsules & Mission Controls */}
      <div className="flex items-center space-x-3">
        {/* Telemetry Capsule 1: Revenue at Risk */}
        {stats?.total_revenue_at_risk > 0 && (
          <div className="hidden lg:flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-space-900/90 border border-amber-500/30 shadow-sm shadow-amber-500/5">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <div>
              <div className="text-[9px] font-mono uppercase font-bold text-amber-300">
                Revenue at Risk
              </div>
              <div className="text-xs font-mono font-black text-amber-400">
                {formatINR(stats.total_revenue_at_risk)}
              </div>
            </div>
          </div>
        )}

        {/* Telemetry Capsule 2: Failed Revenue */}
        {stats?.failed_revenue > 0 && (
          <div className="hidden xl:flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-space-900/90 border border-rose-500/30 shadow-sm shadow-rose-500/5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <div>
              <div className="text-[9px] font-mono uppercase font-bold text-rose-300">
                Failed Volume
              </div>
              <div className="text-xs font-mono font-black text-rose-400">
                {formatINR(stats.failed_revenue)}
              </div>
            </div>
          </div>
        )}

        {/* Action Button: Run Batch AI */}
        <button
          onClick={onOpenBatchModal}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-violet-500 text-white text-xs font-bold font-mono tracking-wide shadow-lg shadow-cyan-500/25 border border-cyan-400/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>RUN BATCH AI</span>
        </button>

        {/* Refresh Telemetry Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh live telemetry stream"
          className="p-2 rounded-xl bg-space-900 hover:bg-space-850 text-slate-300 hover:text-cyan-400 border border-indigo-500/20 hover:border-cyan-500/40 transition-all"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`}
          />
        </button>

        {/* Operator Profile Capsule */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-space-900/80 border border-indigo-500/20 text-xs font-mono text-slate-300">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold text-slate-200 hidden sm:inline">
            OP_SEC_9
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </div>
      </div>
    </header>
  );
}
