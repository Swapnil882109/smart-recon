import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Upload,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  ExternalLink,
  Plus,
  RefreshCw,
  Download
} from 'lucide-react';
import { PurchaseOrder } from '../types';
import { api } from '../services/api';
import { Modal } from '../components/Modal';

interface PurchaseOrdersViewProps {
  onAddToast: (toast: any) => void;
  onNavigate: (view: string) => void;
}

export const PurchaseOrdersView: React.FC<PurchaseOrdersViewProps> = ({
  onAddToast,
  onNavigate,
}) => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);

  // Import Wizard states
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [columnMapping, setColumnMapping] = useState({
    po_number: '',
    supplier: '',
    order_date: '',
    item_desc: '',
    quantity: '',
    unit_price: '',
    total_amount: '',
  });
  const [importing, setImporting] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getPurchaseOrders({ search });
      setOrders(res.purchaseOrders || []);
    } catch (err: any) {
      onAddToast({ type: 'error', title: 'Fetch Failed', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search]);

  const handleOpenDetail = async (id: string) => {
    try {
      const data = await api.getPurchaseOrder(id);
      setSelectedPo(data);
    } catch (err: any) {
      onAddToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  // Import Wizard handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setImporting(true);
        const res = await api.parsePoSpreadsheet(file);
        setParsedData(res);
        setColumnMapping(res.detectedMapping);
        setImportStep(2);
      } catch (err: any) {
        onAddToast({ type: 'error', title: 'Parse Error', message: err.message });
      } finally {
        setImporting(false);
      }
    }
  };

  const handleLoadSampleSpreadsheet = async (sampleName: string) => {
    try {
      setImporting(true);
      const res = await fetch(`/sample-data/${sampleName}`);
      const blob = await res.blob();
      const file = new File([blob], sampleName, {
        type: sampleName.endsWith('.csv') ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const parsed = await api.parsePoSpreadsheet(file);
      setParsedData(parsed);
      setColumnMapping(parsed.detectedMapping);
      setImportStep(2);
    } catch (err: any) {
      onAddToast({ type: 'error', title: 'Sample Error', message: err.message });
    } finally {
      setImporting(false);
    }
  };

  const handleCommitImport = async () => {
    if (!parsedData || !columnMapping.po_number || !columnMapping.supplier) {
      onAddToast({ type: 'warning', title: 'Mapping Incomplete', message: 'PO Number and Supplier fields must be mapped.' });
      return;
    }

    setImporting(true);
    try {
      const res = await api.importPurchaseOrders(parsedData.allRows, columnMapping);
      onAddToast({ type: 'success', title: 'Import Successful', message: res.message });
      setImportModalOpen(false);
      setImportStep(1);
      setParsedData(null);
      fetchOrders();
    } catch (err: any) {
      onAddToast({ type: 'error', title: 'Import Failed', message: err.message });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Purchase Orders Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Contracted purchase orders, line-item price schedules, and invoice association.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setImportStep(1); setImportModalOpen(true); }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:from-indigo-500 hover:to-purple-500 active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search PO number or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#161F33] border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="font-bold text-white">{orders.length}</span> purchase orders
        </div>
      </div>

      {/* PO Table */}
      <div className="rounded-2xl bg-[#111827] border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161F33] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-center">Linked Invoices</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="py-4 px-4 bg-slate-900/30" />
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No purchase orders found matching query.
                  </td>
                </tr>
              ) : (
                orders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">{po.po_number}</td>
                    <td className="py-3 px-4 font-medium text-white">{po.supplier}</td>
                    <td className="py-3 px-4 text-slate-400">{po.order_date}</td>
                    <td className="py-3 px-4 text-center text-slate-300 font-semibold">{po.item_count || 1}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                        {po.related_invoice_count || 0} Invoices
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      ${po.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(po.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PO Detail Modal */}
      {selectedPo && (
        <Modal
          isOpen={!!selectedPo}
          onClose={() => setSelectedPo(null)}
          title={`Purchase Order: ${selectedPo.po_number}`}
          subtitle={`Supplier: ${selectedPo.supplier} | Issued: ${selectedPo.order_date}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block">Subtotal</span>
                <span className="text-white font-bold font-mono">${(selectedPo.subtotal || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Tax (18%)</span>
                <span className="text-white font-bold font-mono">${(selectedPo.tax_amount || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Shipping</span>
                <span className="text-white font-bold font-mono">${(selectedPo.shipping || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Total Contract Value</span>
                <span className="text-indigo-400 font-extrabold font-mono text-sm">
                  ${(selectedPo.total_amount || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white mb-2">Contracted Line Items</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#161F33] text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Item Description</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Unit Rate ($)</th>
                      <th className="py-2 px-3 text-right">Line Total ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-[#111827]">
                    {selectedPo.items && selectedPo.items.map((it, idx) => (
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

            {selectedPo.relatedInvoices && selectedPo.relatedInvoices.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-white mb-2">Reconciled Invoices Under This PO</h4>
                <div className="space-y-2">
                  {selectedPo.relatedInvoices.map((inv: any) => (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-indigo-400">{inv.invoice_number}</span>
                        <span className="text-slate-400 ml-2">Total: ${inv.total_amount.toFixed(2)}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {inv.recon_status || 'Reconciled'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Excel / CSV Import Wizard Modal */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Import Purchase Orders Spreadsheet"
        subtitle="Upload Excel (.xlsx) or CSV files with custom column header mapping"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          {importStep === 1 && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-800 text-center bg-slate-900/40">
                <FileSpreadsheet className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-white">Select Spreadsheet File</h4>
                <p className="text-xs text-slate-400 mt-1">Accepts standard .xlsx, .xls, and .csv exports from SAP, Oracle, or QuickBooks.</p>

                <input
                  type="file"
                  id="poFileInput"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('poFileInput')?.click()}
                  disabled={importing}
                  className="mt-4 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all"
                >
                  {importing ? 'Reading File...' : 'Choose File'}
                </button>
              </div>

              {/* Sample files quick test */}
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <p className="text-xs font-bold text-indigo-300 mb-2">Or test with generated sample files:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadSampleSpreadsheet('Purchase_Orders_Standard.xlsx')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 flex items-center gap-1.5"
                  >
                    <span>Purchase_Orders_Standard.xlsx</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSampleSpreadsheet('Purchase_Orders_Custom_Headers.csv')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 flex items-center gap-1.5"
                  >
                    <span>Purchase_Orders_Custom_Headers.csv</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {importStep === 2 && parsedData && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Detected Rows: <strong className="text-white">{parsedData.rowCount}</strong></span>
                <span className="text-slate-400">Sheet: <strong className="text-white">{parsedData.sheetName}</strong></span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white mb-2">Column Header Mapping</h4>
                <p className="text-[11px] text-slate-400 mb-3">
                  Map the columns from your uploaded file to Smart Recon PO database attributes:
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {Object.keys(columnMapping).map((attr) => (
                    <div key={attr}>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        {attr.replace('_', ' ')}
                      </label>
                      <select
                        value={(columnMapping as any)[attr] || ''}
                        onChange={(e) => setColumnMapping({ ...columnMapping, [attr]: e.target.value })}
                        className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">-- Ignore / Not in file --</option>
                        {parsedData.headers.map((h: string) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setImportStep(1)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCommitImport}
                  disabled={importing}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{importing ? 'Importing Rows...' : 'Confirm & Commit Import'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
