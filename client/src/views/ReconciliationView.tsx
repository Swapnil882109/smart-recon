import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Eye,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { Reconciliation } from '../types';
import { api } from '../services/api';
import { Modal } from '../components/Modal';

interface ReconciliationViewProps {
  onAddToast: (toast: any) => void;
  onNavigate: (view: string) => void;
  isReconciling: boolean;
  onBatchReconcile: () => void;
}

export const ReconciliationView: React.FC<ReconciliationViewProps> = ({
  onAddToast,
  onNavigate,
  isReconciling,
  onBatchReconcile,
}) => {
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDetail, setSelectedDetail] = useState<Reconciliation | null>(null);

  const fetchReconciliations = async () => {
    setLoading(true);
    try {
      const res = await api.getReconciliations({ status: statusFilter });
      setReconciliations(res.results || []);
    } catch (err: any) {
      onAddToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliations();
  }, [statusFilter]);

  const handleOpenComparison = async (id: string) => {
    try {
      const detail = await api.getReconciliation(id);
      setSelectedDetail(detail);
    } catch (err: any) {
      onAddToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Reconciliation Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Algorithmic 3-way invoice-to-PO cross-matching and automated tolerance verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchReconciliations}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onBatchReconcile}
            disabled={isReconciling}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:from-indigo-500 hover:to-purple-500 active:scale-95 disabled:opacity-50"
          >
            <GitCompare className={`w-4 h-4 ${isReconciling ? 'animate-spin' : ''}`} />
            <span>{isReconciling ? 'Executing Matching...' : 'Run Auto-Reconcile All'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Active Tolerances */}
      <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'MATCHED', 'PARTIAL_MATCH', 'MISMATCH', 'REVIEW_REQUIRED', 'CORRUPT'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span>Active Tolerances: Amount ±1.0% ($10.00) | Qty 0% | Date 15d</span>
        </div>
      </div>

      {/* Reconciliations Table */}
      <div className="rounded-2xl bg-[#111827] border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161F33] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">PO Reference</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4 text-right">Invoice Total</th>
                <th className="py-3 px-4 text-right">PO Total</th>
                <th className="py-3 px-4 text-right">Discrepancy</th>
                <th className="py-3 px-4 text-center">Confidence</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={9} className="py-4 px-4 bg-slate-900/30" />
                  </tr>
                ))
              ) : reconciliations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No reconciliation runs found for this filter.
                  </td>
                </tr>
              ) : (
                reconciliations.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">{rec.invoice_number}</td>
                    <td className="py-3 px-4 font-mono text-indigo-400">{rec.po_number || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-300 font-medium">{rec.invoice_supplier}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      ${(rec.invoice_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      ${(rec.po_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={rec.discrepancy_amount > 0 ? 'text-red-400' : 'text-emerald-400'}>
                        ${(rec.discrepancy_amount || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={rec.confidence_score >= 90 ? 'text-emerald-400' : rec.confidence_score >= 60 ? 'text-amber-400' : 'text-red-400'}>
                        {rec.confidence_score}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          rec.status === 'MATCHED'
                            ? 'badge-matched'
                            : rec.status === 'PARTIAL_MATCH'
                            ? 'badge-partial'
                            : rec.status === 'CORRUPT'
                            ? 'badge-corrupt'
                            : 'badge-mismatch'
                        }`}
                      >
                        {rec.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenComparison(rec.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Compare</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side-by-Side Reconciliation Modal */}
      {selectedDetail && (
        <Modal
          isOpen={!!selectedDetail}
          onClose={() => setSelectedDetail(null)}
          title={`3-Way Reconciliation Comparison: ${selectedDetail.invoice_number}`}
          subtitle={`PO: ${selectedDetail.po_number || 'Unlinked'} | Status: ${selectedDetail.status}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6">
            {/* Status Banner */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
                selectedDetail.status === 'MATCHED'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : selectedDetail.status === 'PARTIAL_MATCH'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : selectedDetail.status === 'CORRUPT'
                  ? 'bg-pink-500/10 border-pink-500/30 text-pink-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {selectedDetail.status === 'MATCHED' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
                <div>
                  <span className="font-bold block uppercase">{selectedDetail.status.replace('_', ' ')}</span>
                  <p className="text-[11px] mt-0.5">{selectedDetail.notes}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Confidence</span>
                <span className="font-black text-sm">{selectedDetail.confidence_score}%</span>
              </div>
            </div>

            {/* Side-by-Side Header Table */}
            <div>
              <h4 className="text-xs font-bold text-white mb-2">Header Level Comparison</h4>
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#161F33] text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Field Attribute</th>
                      <th className="py-2.5 px-4">Contracted PO</th>
                      <th className="py-2.5 px-4">Invoiced Value</th>
                      <th className="py-2.5 px-4 text-right">Variance State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-[#111827]">
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-300">Supplier Name</td>
                      <td className="py-2.5 px-4 text-white">{selectedDetail.po_supplier || 'N/A'}</td>
                      <td className="py-2.5 px-4 text-white">{selectedDetail.invoice_supplier}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-400">Match</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-300">Order Ref #</td>
                      <td className="py-2.5 px-4 font-mono text-indigo-400">{selectedDetail.po_number || 'N/A'}</td>
                      <td className="py-2.5 px-4 font-mono text-white">{selectedDetail.invoice_number}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-400">Verified</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-300">Total Amount</td>
                      <td className="py-2.5 px-4 font-mono text-white">${(selectedDetail.po_total || 0).toFixed(2)}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-white">${(selectedDetail.invoice_total || 0).toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold">
                        {Math.abs((selectedDetail.invoice_total || 0) - (selectedDetail.po_total || 0)) < 0.01 ? (
                          <span className="text-emerald-400">$0.00 (Match)</span>
                        ) : (
                          <span className="text-red-400">
                            +${Math.abs((selectedDetail.invoice_total || 0) - (selectedDetail.po_total || 0)).toFixed(2)} Diff
                          </span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Discrepancy Breakdown List */}
            {selectedDetail.discrepancies && selectedDetail.discrepancies.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-white mb-2">Detected Discrepancies</h4>
                <div className="space-y-2">
                  {selectedDetail.discrepancies.map((disc) => (
                    <div
                      key={disc.id}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-4 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              disc.severity === 'CRITICAL'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : disc.severity === 'HIGH'
                                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {disc.severity}
                          </span>
                          <span className="font-bold text-white">{disc.field_name}</span>
                        </div>
                        <p className="text-slate-400 mt-1">{disc.description}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-slate-400 block text-[10px]">Expected vs Actual</span>
                        <span className="font-mono text-slate-300">{disc.expected_value} &rarr; <strong className="text-white">{disc.actual_value}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Close Comparison
              </button>

              {selectedDetail.status !== 'MATCHED' && (
                <button
                  onClick={() => {
                    setSelectedDetail(null);
                    onNavigate('review-queue');
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all flex items-center gap-2"
                >
                  <span>Resolve in Manual Review Queue</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
