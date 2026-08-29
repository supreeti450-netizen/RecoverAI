import React from 'react';
import {
  LayoutDashboard,
  ArrowRightLeft,
  Sparkles,
  UserCheck,
  BarChart3,
  FileCheck,
  Shield,
  ShieldCheck,
  Zap,
  Activity,
  Radio,
  Cpu,
  Lock
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Command Center', icon: LayoutDashboard, tag: 'LIVE' },
  { id: 'transactions', label: 'Telemetry Stream', icon: ArrowRightLeft, tag: '1,000' },
  { id: 'opportunities', label: 'Recovery Targets', icon: Sparkles, tag: 'HIGH YIELD' },
  { id: 'human-review', label: 'Operator Escalations', icon: UserCheck, hasBadge: true },
  { id: 'analytics', label: 'Revenue Intelligence', icon: BarChart3, tag: 'METRICS' },
  { id: 'audit-trail', label: 'Immutable Audit Log', icon: FileCheck, tag: 'HASHED' }
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  stats,
  humanReviewCount
}) {
  return (
    <aside className="w-72 bg-[#05091a]/95 border-r border-indigo-500/20 flex flex-col justify-between select-none relative z-30 shadow-2xl shadow-black/80 backdrop-blur-xl">
      {/* Top Section: Brand Identity */}
      <div>
        <div className="px-6 py-5 border-b border-indigo-500/20 bg-gradient-to-r from-space-900 via-space-850 to-transparent relative overflow-hidden">
          {/* Subtle Cyber Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-violet-500 to-transparent" />

          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-violet-600 p-[1.5px] shadow-lg shadow-cyan-500/20">
                <div className="w-full h-full bg-[#050a22] rounded-[10px] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
                </div>
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-[#050a22] rounded-full radar-ping" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-black tracking-wider text-white font-mono uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                  Recover<span className="text-cyan-400">AI</span>
                </h1>
                <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  v2.4
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-400 tracking-tight">
                Recovery Command Center
              </p>
            </div>
          </div>
        </div>

        {/* Live System Operational Capsule */}
        <div className="px-4 py-3 mx-4 my-3 rounded-xl bg-space-900/90 border border-indigo-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono text-slate-300 font-semibold uppercase">
              Agent Sentinel
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            ONLINE
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="px-3 space-y-1 mt-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const badgeCount = item.id === 'human-review' ? humanReviewCount : null;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/30 via-cyan-600/20 to-transparent text-white border border-cyan-500/40 shadow-lg shadow-cyan-950/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-space-850/60 border border-transparent'
                }`}
              >
                {/* Active Indicator Blade */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-cyan-400 to-violet-500 rounded-r-full shadow-lg shadow-cyan-500" />
                )}

                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? 'text-cyan-400'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className="tracking-wide">{item.label}</span>
                </div>

                {/* Badge Count or Tag */}
                {item.hasBadge && badgeCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20 animate-pulse">
                    {badgeCount}
                  </span>
                ) : item.tag ? (
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-space-800/80 text-slate-400 border border-space-700/60'
                    }`}
                  >
                    {item.tag}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Guardrail Security Sentinel */}
      <div className="p-4 border-t border-indigo-500/20 bg-space-950/90 space-y-2.5">
        <div className="p-3 rounded-xl bg-space-900/90 border border-indigo-500/25 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-[11px] uppercase tracking-wider">Guardrails</span>
            </div>
            <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
              5/5 ACTIVE
            </span>
          </div>

          <div className="w-full bg-space-950 rounded-full h-1.5 overflow-hidden border border-indigo-500/20">
            <div className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full w-full rounded-full" />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Zero-Hallucination</span>
            </span>
            <span className="text-cyan-400">100% Policy</span>
          </div>
        </div>

        <div className="text-[10px] font-mono text-slate-400 text-center flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>PostgreSQL :8469 &bull; Engine v2.4</span>
        </div>
      </div>
    </aside>
  );
}
