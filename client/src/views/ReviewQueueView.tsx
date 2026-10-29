import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  UserCheck,
  Eye,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { User } from '../types';

interface ReviewQueueViewProps {
  onAddToast: (toast: any) => void;
  onRefreshData: () => void;
  user: User | null;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
  onAddToast,
  onRefreshData,
  user,
}) => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [supplierFilter, setSupplierFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Decision form states
  const [decisionAction, setDecisionAction] = useState<'APPROVE' | 'REJECT' | 'RETURN' | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.getReviewQueue({ supplier: supplierFilter });
      setQueue(res.queue || []);
    } catch (err: any) {
      onAddToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [supplierFilter]);

  const handleOpenReview = (item: any) => {
    setSelectedItem(item);
    setDecisionAction(null);
    setDecisionReason('');
    setDecisionNotes('');
  };

  const handleSubmitDecision = async () => {
    if (!selectedItem || !decisionAction) return;
    if (!decisionReason) {
      onAddToast({ type: 'warning', title: 'Reason Required', message: 'Please provide a formal justification for this decision.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitReviewDecision({
        invoiceId: selectedItem.invoice_id,
        reconciliationId: selectedItem.reconciliation_id,
        action: decisionAction,
        reviewerName: user?.name || 'Alex Morgan',
        reason: decisionReason,
        notes: decisionNotes,
      });

      onAddToast({ type: 'success', title: 'Decision Recorded', message: res.message });
      setSelectedItem(null);
      fetchQueue();
      onRefreshData();
    } catch (err: any) {
      onAddToast({ type: 'error', title: 'Submission Error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Manual Review & Exception Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review and resolve pricing disputes, overbillings, and document exceptions with traceable audit decisions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchQueue}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="px-3.5 py-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs font-bold text-red-400">
            {queue.length} Pending Exceptions
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Filter by vendor name..."
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="w-full bg-[#161F33] border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-400">
          Prioritized by <strong className="text-white">Critical Severity</strong>
        </div>
      </div>

      {/* Queue List */}
      <div className="space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-[#111827] border border-slate-800 rounded-2xl animate-pulse" />
          ))
        ) : queue.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#111827] border border-slate-800">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">Review Queue Cleared</h3>
            <p className="text-xs text-slate-400 mt-1">All invoices are currently reconciled or approved under tolerance.</p>
          </div>
        ) : (
          queue.map((item) => (
            <div
              key={item.invoice_id}
              className="p-6 rounded-2xl bg-[#111827] border border-slate-800 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-base font-bold text-white">{item.invoice_number}</span>
                  <span className="text-xs text-slate-400">for PO</span>
                  <span className="font-mono text-xs font-bold text-indigo-400">{item.po_number || 'Unlinked'}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      item.recon_status === 'CORRUPT'
                        ? 'badge-corrupt'
                        : item.recon_status === 'REVIEW_REQUIRED'
                        ? 'badge-review'
                        : 'badge-mismatch'
                    }`}
                  >
                    {item.recon_status}
                  </span>
                  <span className="text-xs text-slate-500">|</span>
                  <span className="text-xs text-slate-300 font-semibold">{item.supplier}</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.recon_notes || 'Requires finance sign-off due to variance.'}
                </p>

                {/* Discrepancy Pills */}
                {item.discrepancies && item.discrepancies.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {item.discrepancies.map((d: any) => (
                      <span
                        key={d.id}
                        className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            d.severity === 'CRITICAL' ? 'bg-red-400' : 'bg-amber-400'
                          }`}
                        />
                        <strong className="text-white">{d.field_name}:</strong> {d.description}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Amount & Actions */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-end justify-between gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Billed</span>
                  <span className="text-lg font-black font-mono text-white">
                    ${(item.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <button
                  onClick={() => handleOpenReview(item)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Eye className="w-4 h-4" />
                  <span>Review & Decide</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review & Resolution Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={`Exception Resolution: ${selectedItem.invoice_number}`}
          subtitle={`Supplier: ${selectedItem.supplier} | PO Ref: ${selectedItem.po_number || 'N/A'}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Invoiced Amount:</span>
                <span className="text-white font-mono font-bold">${(selectedItem.total_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Calculated Variance:</span>
                <span className="text-red-400 font-mono font-bold">
                  +${(selectedItem.discrepancy_amount || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Exception Status:</span>
                <span className="font-bold text-indigo-400">{selectedItem.recon_status}</span>
              </div>
            </div>

            {/* Action Selection */}
            <div>
              <label className="text-xs font-bold text-white block mb-2">Select Resolution Action</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => { setDecisionAction('APPROVE'); setDecisionReason('Manager approved variance within budget'); }}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    decisionAction === 'APPROVE'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                  <span className="text-xs block">Approve Override</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setDecisionAction('REJECT'); setDecisionReason('Unauthorized rate or quantity inflation'); }}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    decisionAction === 'REJECT'
                      ? 'bg-red-500/20 border-red-500 text-red-300 font-bold shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <XCircle className="w-5 h-5 mx-auto mb-1 text-red-400" />
                  <span className="text-xs block">Reject Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setDecisionAction('RETURN'); setDecisionReason('Returned to supplier for revised invoice'); }}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    decisionAction === 'RETURN'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <RotateCcw className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                  <span className="text-xs block">Return to Vendor</span>
                </button>
              </div>
            </div>

            {decisionAction && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Formal Audit Justification <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    placeholder="e.g. Approved emergency freight surcharge approved by Operations Director"
                    className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Internal Reviewer Notes</label>
                  <textarea
                    rows={3}
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    placeholder="Provide additional context for external and internal audit trails..."
                    className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!decisionAction || submitting}
                onClick={handleSubmitDecision}
                className="px-6 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{submitting ? 'Recording Decision...' : 'Commit Audit Decision'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
