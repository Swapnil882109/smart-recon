import React from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  ArrowUpRight,
  UploadCloud,
  FileSpreadsheet,
  GitCompare,
  BarChart3,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DashboardStats } from '../types';

interface DashboardViewProps {
  stats: DashboardStats | null;
  loading: boolean;
  onRefresh: () => void;
  onNavigate: (view: string) => void;
  onBatchReconcile: () => void;
  isReconciling: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  loading,
  onRefresh,
  onNavigate,
  onBatchReconcile,
  isReconciling,
}) => {
  if (loading || !stats) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-48 bg-slate-800 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-[#111827] border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-[#111827] border border-slate-800 rounded-2xl animate-pulse lg:col-span-2" />
          <div className="h-80 bg-[#111827] border border-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const { kpi, distribution, monthlyTrends, categoryDiscrepancies, recentActivity, topSuppliers } = stats;

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Reconciliation Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time automated matching, discrepancy analysis, and exception workflows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            title="Refresh metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('upload')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Invoice</span>
          </button>
          <button
            onClick={onBatchReconcile}
            disabled={isReconciling}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <GitCompare className={`w-4 h-4 ${isReconciling ? 'animate-spin' : ''}`} />
            <span>{isReconciling ? 'Matching...' : 'Auto-Match All'}</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Invoices */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 hover:border-slate-700 transition-all group">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Processed</span>
            <div className="p-2 rounded-xl bg-slate-800/80 text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{kpi.totalInvoices}</div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>Spend: ${kpi.totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> +12%
              </span>
            </div>
          </div>
        </div>

        {/* 100% Matched */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 hover:border-emerald-500/40 transition-all group shadow-sm hover:shadow-glow-emerald">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Matched</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400">{kpi.matched.count}</div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>Rate: {kpi.matched.rate}%</span>
              <span className="text-emerald-400 font-bold">${kpi.matched.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>

        {/* Partial Match */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 hover:border-amber-500/40 transition-all group shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Partial Match</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-400">{kpi.partial.count}</div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>Within tolerance</span>
              <span className="text-slate-300 font-bold">${kpi.partial.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>

        {/* Mismatches */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 hover:border-red-500/40 transition-all group shadow-sm hover:shadow-glow-rose">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-400">Mismatches</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-red-400">{kpi.mismatch.count}</div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>Critical variance</span>
              <span className="text-red-400 font-bold">${kpi.mismatch.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>

        {/* Pending Reviews */}
        <div
          onClick={() => onNavigate('review-queue')}
          className="p-5 rounded-2xl bg-[#111827] border border-slate-800 hover:border-purple-500/40 transition-all group cursor-pointer shadow-sm hover:shadow-glow-purple"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Pending Review</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-400">{kpi.pendingReviews.count}</div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span className="text-purple-300 group-hover:underline flex items-center gap-1">
                Open Queue <ExternalLink className="w-3 h-3" />
              </span>
              <span className="text-slate-300 font-bold">${kpi.pendingReviews.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Volume Trend Chart */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Monthly Processing Volume & Match Rates</h3>
              <p className="text-xs text-slate-400 mt-0.5">Accounts payable volume trend across recent billing cycles</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
              Fiscal Year 2026
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorMatched" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" vertical={false} />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161F33', borderColor: '#1F293D', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="volume" name="Total Volume ($)" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorVolume)" />
                <Area type="monotone" dataKey="matched" name="Matched Clean ($)" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorMatched)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Donut Chart */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Reconciliation Status</h3>
              <p className="text-xs text-slate-400 mt-0.5">Breakdown by current state</p>
            </div>
          </div>

          <div className="h-60 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#161F33', borderColor: '#1F293D', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-white">{kpi.totalInvoices}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Total</span>
            </div>
          </div>

          <div className="mt-2 space-y-1.5">
            {distribution.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-300 font-medium">{d.name}</span>
                </div>
                <span className="font-bold text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row: Discrepancy Breakdown & Top Suppliers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Discrepancy Breakdown */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Discrepancy Category Breakdown</h3>
              <p className="text-xs text-slate-400 mt-0.5">Root causes of detected matching variances</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDiscrepancies} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" horizontal={false} />
                <XAxis type="number" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis dataKey="category" type="category" stroke="#64748B" fontSize={11} tickLine={false} width={130} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161F33', borderColor: '#1F293D', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="count" name="Exception Count" radius={[0, 6, 6, 0]}>
                  {categoryDiscrepancies.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Suppliers Spend & Compliance */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Top Suppliers by Volume</h3>
              <p className="text-xs text-slate-400 mt-0.5">Spend totals and reconciliation throughput</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="pb-3">Supplier Name</th>
                  <th className="pb-3 text-center">Invoices</th>
                  <th className="pb-3 text-right">Total Invoiced</th>
                  <th className="pb-3 text-right">Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {topSuppliers.map((supp, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 font-semibold text-white">{supp.supplier}</td>
                    <td className="py-3 text-center text-slate-300">{supp.invoice_count}</td>
                    <td className="py-3 text-right font-bold text-slate-200">
                      ${supp.total_spend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {92 - idx * 4}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Activity Log Stream */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Live Audit Activity Stream</h3>
            <p className="text-xs text-slate-400 mt-0.5">Chronological system events and financial reconciliation decisions</p>
          </div>
          <button
            onClick={() => onNavigate('activity')}
            className="text-xs text-indigo-400 font-semibold hover:underline flex items-center gap-1"
          >
            <span>View Full Log</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {recentActivity.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/70 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                <div>
                  <span className="font-semibold text-white">{log.user_name}</span>{' '}
                  <span className="text-slate-400">({log.user_role})</span>:{' '}
                  <span className="text-slate-300">{log.details}</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-500 shrink-0 font-mono">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
