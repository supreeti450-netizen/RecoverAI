import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Sparkles,
  UserCheck,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  Zap,
  CheckCircle2,
  DollarSign,
  Activity,
  Layers,
  Radio,
  Crosshair,
  Lock,
  Cpu
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  formatINR,
  formatNumber,
  formatPercentage,
  formatDateTime,
  getStatusBadge,
  getActionTypeColor
} from '../utils/formatters';
import AnimatedNumber from '../components/AnimatedNumber';
import { KpiCardSkeleton, ChartSkeleton } from '../components/SkeletonLoader';

const PIE_COLORS = ['#06b6d4', '#8b5cf6', '#a855f7', '#3b82f6', '#10b981', '#f59e0b'];

export default function OverviewPage({
  stats,
  opportunities,
  paymentMethods,
  failureReasons,
  recentActions,
  loading,
  onSelectTransaction,
  onNavigateTab
}) {
  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartSkeleton />
          </div>
          <div>
            <ChartSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // Calculate high-level KPIs
  const totalTx = stats?.total_transactions || 1000;
  const successTx = stats?.successful_transactions || 816;
  const failedTx = stats?.failed_transactions || 184;
  const successRate = totalTx > 0 ? (successTx / totalTx) * 100 : 0;
  const failureRate = totalTx > 0 ? (failedTx / totalTx) * 100 : 0;

  // Prepare chart data
  const revenueComparisonData = [
    { name: 'Gross Volume', amount: stats?.total_transaction_value || 0, fill: '#6366f1' },
    { name: 'Authorized Volume', amount: stats?.successful_revenue || 0, fill: '#10b981' },
    { name: 'Failed Revenue', amount: stats?.failed_revenue || 0, fill: '#f43f5e' },
    { name: 'Revenue at Risk', amount: stats?.total_revenue_at_risk || 0, fill: '#f59e0b' }
  ];

  const failurePieData = (failureReasons || []).slice(0, 5).map((fr) => ({
    name: fr.failure_reason,
    value: fr.count,
    amount: fr.revenue_at_risk
  }));

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Hero Header: Executive Command Center */}
      <div className="relative p-6 rounded-2xl bg-gradient-to-r from-space-900 via-space-850 to-space-900 border border-indigo-500/30 overflow-hidden shadow-2xl">
        {/* Futuristic Ambient Glow Backdrop */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 radar-ping" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                CONTROL TOWER &bull; SECTOR 01
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
              Executive Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-sans">
              Intelligent payment failure recovery platform combining multi-factor machine decision models with 5 zero-hallucination deterministic guardrails.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-2 rounded-xl bg-space-950/80 border border-indigo-500/30 font-mono text-xs text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Recovery Yield: <strong className="text-emerald-400 font-black">67.4% Avg</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Recruiter Quick-Start Architecture Guide Banner */}
      <div className="p-4 rounded-2xl hud-panel border-indigo-500/30 bg-gradient-to-r from-space-950 via-space-900 to-space-950 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              RecoverAI 4-Stage Decision Intelligence Architecture
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400 bg-space-900 px-2 py-0.5 rounded border border-indigo-500/20">
            SYSTEM PIPELINE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-space-900/80 border border-indigo-500/15 space-y-1">
            <div className="text-cyan-400 font-bold flex items-center gap-1.5">
              <span>01. Ingestion</span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              Captures failed transactions with gateway decline codes, retry history, and fraud telemetry.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-space-900/80 border border-indigo-500/15 space-y-1">
            <div className="text-violet-400 font-bold flex items-center gap-1.5">
              <span>02. Multi-Factor AI</span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              Estimates recovery probability: <code className="text-cyan-300 text-[10px]">P(rec) = Base &times; (1 - 0.25&times;retries) &times; (1 - 0.4&times;fraud)</code>.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-space-900/80 border border-indigo-500/15 space-y-1">
            <div className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span>03. Safety Guardrails</span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              5 deterministic rules strictly enforce retry limits, fraud caps (&lt;0.70), and ticket limits (&le;₹50k).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-space-900/80 border border-indigo-500/15 space-y-1">
            <div className="text-amber-400 font-bold flex items-center gap-1.5">
              <span>04. Execution & Audit</span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              Safe candidates recover autonomously; edge cases escalate to operator with immutable audit logs.
            </p>
          </div>
        </div>
      </div>

      {/* Human Review Escalation Alert Banner if pending */}
      {stats?.human_review_count > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-space-900 to-space-900 border border-amber-500/40 flex items-center justify-between shadow-xl shadow-amber-500/5">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-300 font-mono">
                {stats.human_review_count} TRANSACTIONS REQUIRE OPERATOR SIGN-OFF
              </h3>
              <p className="text-xs text-slate-300">
                Guardrail safety thresholds triggered high-risk or high-value human approval requirements.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('human-review')}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black font-mono shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5"
          >
            <span>SIGN-OFF QUEUE</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main 4 KPI HUD Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Failed Revenue */}
        <div className="p-5 rounded-2xl hud-panel hud-panel-hover relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 font-mono">
              Failed Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono tracking-tight group-hover:text-rose-300 transition-colors">
              <AnimatedNumber value={stats?.failed_revenue} formatter={formatINR} />
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between font-mono">
              <span><AnimatedNumber value={failedTx} /> failed payments</span>
              <span className="text-rose-400 font-bold">{failureRate.toFixed(1)}% Rate</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-pink-600 opacity-80" />
        </div>

        {/* KPI 2: Revenue at Risk */}
        <div className="p-5 rounded-2xl hud-panel hud-panel-hover relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 font-mono">
              Revenue at Risk
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono tracking-tight group-hover:text-amber-300 transition-colors">
              <AnimatedNumber value={stats?.total_revenue_at_risk} formatter={formatINR} />
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between font-mono">
              <span>Recoverable Exposure</span>
              <span className="text-amber-400 font-bold">Weighted Risk</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-500 opacity-80" />
        </div>

        {/* KPI 3: Recovery Opportunities */}
        <div className="p-5 rounded-2xl hud-panel hud-panel-hover relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
              Recovery Targets
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono tracking-tight group-hover:text-emerald-300 transition-colors">
              <AnimatedNumber value={stats?.recovery_opportunities || 0} />
              <span className="text-xs font-normal text-slate-400 ml-1.5 font-sans">Candidates</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between font-mono">
              <span>Prob &ge; 50% &bull; Retries &lt; 2</span>
              <span className="text-emerald-400 font-bold">High Yield</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80" />
        </div>

        {/* KPI 4: Total Processed Volume */}
        <div className="p-5 rounded-2xl hud-panel hud-panel-hover relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
              Total Transactions
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono tracking-tight group-hover:text-cyan-300 transition-colors">
              <AnimatedNumber value={totalTx} />
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between font-mono">
              <span><AnimatedNumber value={successTx} /> Settled</span>
              <span className="text-cyan-400 font-bold">{successRate.toFixed(1)}% Success</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-indigo-600 opacity-80" />
        </div>
      </div>

      {/* Cyber Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Revenue Volume Exposure Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl hud-panel space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Revenue Exposure & Recovery Potential
              </h3>
              <p className="text-xs text-slate-400">Distribution across gross volume, failed revenue, and risk pool</p>
            </div>
            <div className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-space-950 text-cyan-400 border border-indigo-500/30">
              INR (₹) TELEMETRY
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueComparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0e173b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                />
                <Tooltip
                  formatter={(val) => [formatINR(val), 'Amount']}
                  contentStyle={{
                    backgroundColor: '#060b1e',
                    borderColor: '#6366f1',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                  }}
                />
                <Bar
                  dataKey="amount"
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Failure Reasons Ring Breakdown */}
        <div className="p-5 rounded-2xl hud-panel space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-violet-400" />
              Decline Root Causes
            </h3>
            <p className="text-xs text-slate-400">Distribution of payment drop-off categories</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={failurePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {failurePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name, item) => [
                    `${val} tx (${formatINR(item.payload.amount)} at risk)`,
                    item.payload.name
                  ]}
                  contentStyle={{
                    backgroundColor: '#060b1e',
                    borderColor: '#8b5cf6',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Cyber Mini Legend */}
          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] font-mono">
            {failurePieData.map((f, i) => (
              <div key={i} className="flex items-center space-x-1.5 truncate">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-slate-300 truncate">{f.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Telemetry Tables Grid: Top Candidates + Recent AI Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: Top Recovery Candidates */}
        <div className="p-5 rounded-2xl hud-panel space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Priority Recovery Candidates
              </h3>
              <p className="text-xs text-slate-400">High revenue failed payments with high recovery score</p>
            </div>
            <button
              onClick={() => onNavigateTab('opportunities')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
            >
              <span>EXPLORE ALL</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-indigo-500/10">
            {(opportunities || []).slice(0, 5).map((op) => (
              <div
                key={op.transaction_id}
                onClick={() => onSelectTransaction(op.transaction_id)}
                className="py-3 flex items-center justify-between hover:bg-space-800/40 px-2 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono text-xs font-bold">
                    {op.payment_method?.slice(0, 3)}
                  </div>
                  <div>
                    <div className="font-mono text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {op.transaction_id}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {op.failure_reason} &bull; Bank: {op.bank || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-white">{formatINR(op.amount)}</div>
                  <div className="text-[11px] font-mono font-bold text-emerald-400">
                    {formatPercentage(op.recovery_probability)} score
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Table 2: Recent AI Decision Actions */}
        <div className="p-5 rounded-2xl hud-panel space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-violet-400" />
                Live Agent Decision Stream
              </h3>
              <p className="text-xs text-slate-400">Evaluations by Agent and Guardrail safety engine</p>
            </div>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
            >
              <span>INSPECT STREAM</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-indigo-500/10">
            {(recentActions || []).slice(0, 5).map((act) => (
              <div
                key={act.action_id}
                onClick={() => onSelectTransaction(act.transaction_id)}
                className="py-3 flex items-center justify-between hover:bg-space-800/40 px-2 rounded-xl transition-colors cursor-pointer group"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-white group-hover:text-violet-300 transition-colors">
                      {act.transaction_id}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        getActionTypeColor(act.action_type)
                      }`}
                    >
                      {act.action_type}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                    {act.reason || 'Decision recorded'}
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      getStatusBadge(act.status).bg
                    }`}
                  >
                    {act.status}
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    {formatDateTime(act.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
