import React, { useState, useEffect } from 'react';
import { History, Search, Filter, ShieldCheck, RefreshCw, UserCheck, Clock } from 'lucide-react';
import { ActivityLog } from '../types';
import { api } from '../services/api';

interface ActivityLogViewProps {
  onAddToast: (toast: any) => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ onAddToast }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getActivityLogs({ action: actionFilter });
      setLogs(res.logs || []);
    } catch (err: any) {
      onAddToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const getActionBadge = (action: string) => {
    if (action.includes('APPROVE') || action.includes('MATCH')) {
      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
    } else if (action.includes('REJECT') || action.includes('FLAG')) {
      return 'bg-red-500/15 text-red-400 border border-red-500/30';
    } else if (action.includes('UPLOAD') || action.includes('IMPORT')) {
      return 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30';
    } else {
      return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            System Activity & Compliance Audit Log
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Immutable, server-signed event log tracking user authentication, document ingests, and financial decisions.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'ALL', label: 'All Events' },
          { id: 'RECONCILIATION_RUN', label: 'Reconciliations' },
          { id: 'INVOICE_UPLOAD', label: 'Uploads' },
          { id: 'PO_IMPORT', label: 'PO Imports' },
          { id: 'REVIEW_APPROVE', label: 'Review Approvals' },
          { id: 'SETTINGS_UPDATE', label: 'Settings Changes' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setActionFilter(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              actionFilter === f.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Audit Table */}
      <div className="rounded-2xl bg-[#111827] border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161F33] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="py-4 px-4 bg-slate-900/30" />
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No log events recorded under this filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">{log.user_name}</td>
                    <td className="py-3 px-4 text-indigo-400 font-medium">{log.user_role}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-md truncate">{log.details}</td>
                    <td className="py-3 px-4 text-right text-slate-500 font-mono">{log.ip_address || '127.0.0.1'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
