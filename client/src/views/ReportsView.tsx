import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  RefreshCw,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

interface ReportsViewProps {
  onAddToast: (toast: any) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onAddToast }) => {
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.getReportsSummary();
      setReport(res.report || []);
    } catch (err: any) {
      onAddToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Executive Financial Reports & Exports
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Accounts payable audit summaries, vendor discrepancy logs, and exportable datasets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchReport}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print View</span>
          </button>
          <a
            href="/api/reports/export/csv"
            download="smart_recon_report.csv"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Export CSV</span>
          </a>
          <a
            href="/api/reports/export/xlsx"
            download="smart_recon_report.xlsx"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all hover:from-emerald-500 hover:to-teal-500"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel (.XLSX)</span>
          </a>
        </div>
      </div>

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Audited Records</span>
          <div className="text-2xl font-black text-white mt-2">{report.length}</div>
          <span className="text-xs text-slate-400 mt-1 block">Cross-relational reconciliation runs</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">Compliance Rate</span>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {report.length > 0 ? Math.round((report.filter(r => r.status === 'MATCHED' || r.status === 'PARTIAL_MATCH').length / report.length) * 100) : 0}%
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Approved clean or under tolerance</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800">
          <span className="text-xs font-semibold text-red-400 uppercase tracking-wider block">Total Discrepancies Flagged</span>
          <div className="text-2xl font-black text-red-400 mt-2">
            ${report.reduce((acc, r) => acc + (r.discrepancy_amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Prevented unapproved overbilling</span>
        </div>
      </div>

      {/* Reports Table */}
      <div className="rounded-2xl bg-[#111827] border border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Reconciliation Audit Log</h3>
          <span className="text-xs text-slate-400">Export format contains complete cell data</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161F33] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">PO Reference</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4 text-right">Inv Total</th>
                <th className="py-3 px-4 text-right">PO Total</th>
                <th className="py-3 px-4 text-right">Variance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Audit Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="py-4 px-4 bg-slate-900/30" />
                  </tr>
                ))
              ) : report.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No report records available.
                  </td>
                </tr>
              ) : (
                report.map((row) => (
                  <tr key={row.recon_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">{row.invoice_number}</td>
                    <td className="py-3 px-4 font-mono text-indigo-400">{row.po_number || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-300">{row.invoice_supplier}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">${(row.invoice_total || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">${(row.po_total || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={row.discrepancy_amount > 0 ? 'text-red-400' : 'text-emerald-400'}>
                        ${(row.discrepancy_amount || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          row.status === 'MATCHED'
                            ? 'badge-matched'
                            : row.status === 'PARTIAL_MATCH'
                            ? 'badge-partial'
                            : row.status === 'CORRUPT'
                            ? 'badge-corrupt'
                            : 'badge-mismatch'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 font-mono">
                      {new Date(row.reconciliation_date).toLocaleDateString()}
                    </td>
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
