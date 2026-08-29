import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Info,
  Activity,
  Cpu
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import {
  formatINR,
  formatPercentage,
  formatNumber
} from '../utils/formatters';
import { ChartSkeleton } from '../components/SkeletonLoader';

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [failureReasons, setFailureReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.getAnalyticsSummary(),
      api.getPaymentMethodAnalytics(),
      api.getFailureReasonAnalytics()
    ])
      .then(([summaryRes, pmRes, frRes]) => {
        setStats(summaryRes.summary);
        setPaymentMethods(pmRes.data || []);
        setFailureReasons(frRes.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load analytics');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
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

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-mono">
        {error}
      </div>
    );
  }

  const pmComparisonData = paymentMethods.map((pm) => ({
    name: pm.payment_method,
    Total: pm.total_transactions,
    Successful: pm.successful_transactions,
    Failed: pm.failed_transactions,
    FailureRate: pm.failure_rate_percentage,
    RiskAmount: pm.revenue_at_risk
  }));

  const failureReasonsData = failureReasons.map((fr) => ({
    name: fr.failure_reason,
    Count: fr.count,
    RevenueAtRisk: fr.revenue_at_risk,
    AvgProb: Number((fr.avg_recovery_probability * 100).toFixed(1)),
    Recoverable: fr.recoverable_count
  }));

  const decisionBreakdownData = [
    { name: 'Approved Automations', value: stats?.approved_action_count || 0, color: '#10b981' },
    { name: 'Operator Escalations', value: stats?.human_review_count || 0, color: '#f59e0b' },
    { name: 'Blocked Actions', value: stats?.blocked_action_count || 0, color: '#f43f5e' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Strategic Intelligence Capsules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl hud-panel space-y-2 relative overflow-hidden group">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Zap className="w-4 h-4" />
            <span>Highest Failure Channel</span>
          </div>
          <div className="text-2xl font-black text-white font-mono group-hover:text-cyan-300 transition-colors">
            {pmComparisonData.length > 0 ? pmComparisonData[0].name : 'N/A'}
          </div>
          <p className="text-xs text-slate-300">
            Accounts for largest failed revenue concentration and recoverable exposure.
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-indigo-500 opacity-80" />
        </div>

        <div className="p-5 rounded-2xl hud-panel space-y-2 relative overflow-hidden group">
          <div className="flex items-center space-x-2 text-violet-400 text-xs font-mono font-bold uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" />
            <span>Top Failure Root Cause</span>
          </div>
          <div className="text-2xl font-black text-white font-mono group-hover:text-violet-300 transition-colors">
            {failureReasonsData.length > 0 ? failureReasonsData[0].name : 'N/A'}
          </div>
          <p className="text-xs text-slate-300">
            Gateway and network timeouts present highest automated recovery yields.
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500 opacity-80" />
        </div>

        <div className="p-5 rounded-2xl hud-panel space-y-2 relative overflow-hidden group">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Recovery Pool Coverage</span>
          </div>
          <div className="text-2xl font-black text-white font-mono group-hover:text-emerald-300 transition-colors">
            {formatPercentage(
              stats?.total_failed_transactions > 0
                ? stats.recovery_opportunities / stats.failed_transactions
                : 0.45
            )}
          </div>
          <p className="text-xs text-slate-300">
            Of total payment drop-offs meet strict automated recovery safety criteria.
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80" />
        </div>
      </div>

      {/* Row 1: Payment Method Breakdown & Failure Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Channel Volume */}
        <div className="p-5 rounded-2xl hud-panel space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-cyan-400" />
              Channel Transaction Breakdown
            </h3>
            <p className="text-xs text-slate-400">Total volume vs settled and failed transactions</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pmComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0e173b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#060b1e',
                    borderColor: '#6366f1',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Successful" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Failed" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Failure Rate */}
        <div className="p-5 rounded-2xl hud-panel space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              Failure Rate Percentage (%) by Route
            </h3>
            <p className="text-xs text-slate-400">Proportion of failed transactions per payment route</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pmComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0e173b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Failure Rate']}
                  contentStyle={{
                    backgroundColor: '#060b1e',
                    borderColor: '#f59e0b',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="FailureRate" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Decline Root Causes & AI Decision Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Failure Reasons Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl hud-panel space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-indigo-400" />
              Revenue at Risk by Decline Code
            </h3>
            <p className="text-xs text-slate-400">Total monetary exposure caused by specific decline codes</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={failureReasonsData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0e173b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-15} textAnchor="end" />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                />
                <Tooltip
                  formatter={(val) => [formatINR(val), 'Revenue at Risk']}
                  contentStyle={{
                    backgroundColor: '#060b1e',
                    borderColor: '#6366f1',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="RevenueAtRisk" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Action Execution Split Donut */}
        <div className="p-5 rounded-2xl hud-panel space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              AI Decision Distribution
            </h3>
            <p className="text-xs text-slate-400">Status distribution of analyzed recovery actions</p>
          </div>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={decisionBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {decisionBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val} actions`, name]}
                  contentStyle={{
                    backgroundColor: '#060b1e',
                    borderColor: '#6366f1',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 pt-1 text-[11px] font-mono">
            {decisionBreakdownData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name}
                </span>
                <span className="font-bold text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
