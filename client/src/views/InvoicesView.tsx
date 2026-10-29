import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Trash2,
  RefreshCw,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { Invoice } from '../types';
import { api } from '../services/api';
import { Modal } from '../components/Modal';

interface InvoicesViewProps {
  onAddToast: (toast: any) => void;
  onNavigate: (view: string) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  onAddToast,
  onNavigate,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.getInvoices({ search });
      setInvoices(res.invoices || []);
    } catch (err: any) {
      onAddToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [search]);

  const handleOpenDetail = async (id: string) => {
    try {
      const data = await api.getInvoice(id);
      setSelectedInvoice(data);
    } catch (err: any) {
      onAddToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const handleDelete = async (id: string, invNum: string) => {
    if (!window.confirm(`Are you sure you want to delete invoice ${invNum}?`)) return;
    try {
      await api.deleteInvoice(id);
      onAddToast({ type: 'success', title: 'Deleted', message: `Invoice ${invNum} removed.` });
      fetchInvoices();
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
            Invoices Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Complete registry of all ingested supplier invoices, line items, and audit statuses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchInvoices}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('upload')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New Invoice</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search invoice #, supplier, or PO #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#161F33] border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-400">
          Total: <strong className="text-white">{invoices.length}</strong> invoices
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl bg-[#111827] border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161F33] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">PO Ref</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Invoice Date</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Recon Status</th>
                <th className="py-3 px-4">Review Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="py-4 px-4 bg-slate-900/30" />
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No invoice records found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">{inv.invoice_number}</td>
                    <td className="py-3 px-4 font-mono text-indigo-400">{inv.po_number || 'N/A'}</td>
                    <td className="py-3 px-4 font-medium text-slate-200">{inv.supplier}</td>
                    <td className="py-3 px-4 text-slate-400">{inv.invoice_date}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      ${(inv.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          inv.recon_status === 'MATCHED'
                            ? 'badge-matched'
                            : inv.recon_status === 'PARTIAL_MATCH'
                            ? 'badge-partial'
                            : inv.recon_status === 'CORRUPT'
                            ? 'badge-corrupt'
                            : 'badge-mismatch'
                        }`}
                      >
                        {inv.recon_status || inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium">
                      {inv.review_status || 'Pending'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenDetail(inv.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(inv.id, inv.invoice_number)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors"
                        title="Delete invoice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice Details: ${selectedInvoice.invoice_number}`}
          subtitle={`Supplier: ${selectedInvoice.supplier} | Issued: ${selectedInvoice.invoice_date}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block">Subtotal</span>
                <span className="text-white font-mono font-bold">${(selectedInvoice.subtotal || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Tax</span>
                <span className="text-white font-mono font-bold">${(selectedInvoice.tax_amount || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Shipping</span>
                <span className="text-white font-mono font-bold">${(selectedInvoice.shipping || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Total Amount</span>
                <span className="text-emerald-400 font-mono font-extrabold text-sm">
                  ${(selectedInvoice.total_amount || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white mb-2">Itemized Breakdown</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#161F33] text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3 text-center">Quantity</th>
                      <th className="py-2 px-3 text-right">Unit Rate ($)</th>
                      <th className="py-2 px-3 text-right">Line Total ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-[#111827]">
                    {selectedInvoice.items && selectedInvoice.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 text-white font-medium">{it.item_desc}</td>
                        <td className="py-2 px-3 text-center text-slate-300 font-semibold">{it.quantity}</td>
                        <td className="py-2 px-3 text-right font-mono">${it.unit_price.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-white">${it.total_price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedInvoice.reviewer_notes && (
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 text-xs text-purple-300">
                <strong className="block text-white mb-0.5">Audit Note:</strong>
                {selectedInvoice.reviewer_notes}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
