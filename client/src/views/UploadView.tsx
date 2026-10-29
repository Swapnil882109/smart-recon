import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileCheck,
  ArrowRight,
  Download,
  Trash2,
  Sparkles,
  Edit3,
  GitCompare,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

interface UploadViewProps {
  onAddToast: (toast: any) => void;
  onNavigate: (view: string) => void;
  onRefreshData: () => void;
}

export const UploadView: React.FC<UploadViewProps> = ({
  onAddToast,
  onNavigate,
  onRefreshData,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [reconResult, setReconResult] = useState<any | null>(null);
  const [savingCorrection, setSavingCorrection] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      onAddToast({
        type: 'error',
        title: 'Unsupported File Format',
        message: 'Only PDF, PNG, and JPG invoices are accepted.'
      });
      return;
    }

    setUploading(true);
    setUploadProgress(20);
    setExtractedData(null);
    setReconResult(null);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 150);

    try {
      const res = await api.uploadInvoice(file);
      clearInterval(progressInterval);
      setUploadProgress(100);

      setExtractedData(res.extracted);
      setActiveInvoiceId(res.invoiceId);
      setReconResult(res.reconciliation);

      onRefreshData();

      if (res.reconciliation && res.reconciliation.status === 'MATCHED') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        onAddToast({
          type: 'success',
          title: '100% Reconciliation Match!',
          message: `Invoice ${res.extracted.invoice_number} perfectly matches PO ${res.extracted.po_number}.`
        });
      } else if (res.extracted.isCorrupt) {
        onAddToast({
          type: 'error',
          title: 'Corrupt Document Detected',
          message: 'Document integrity assertions failed (QA test violations detected).'
        });
      } else {
        onAddToast({
          type: 'warning',
          title: 'Extraction Complete - Review Needed',
          message: `Invoice ${res.extracted.invoice_number} processed with ${res.reconciliation?.discrepancies?.length || 0} discrepancy flag(s).`
        });
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      onAddToast({
        type: 'error',
        title: 'Upload Failed',
        message: err.message || 'Error parsing document.'
      });
    } finally {
      setUploading(false);
    }
  };

  // Helper to load test samples directly from sample-data
  const handleLoadSample = async (sampleFileName: string, label: string) => {
    try {
      setUploading(true);
      setUploadProgress(30);
      const response = await fetch(`/sample-data/${sampleFileName}`);
      const blob = await response.blob();
      const file = new File([blob], sampleFileName, { type: sampleFileName.endsWith('.pdf') ? 'application/pdf' : 'image/png' });
      await processFile(file);
    } catch (err: any) {
      onAddToast({ type: 'error', title: 'Sample Load Error', message: `Could not load ${label}` });
      setUploading(false);
    }
  };

  // Save manual corrections
  const handleSaveCorrections = async () => {
    if (!activeInvoiceId || !extractedData) return;
    setSavingCorrection(true);
    try {
      const res = await api.correctInvoice(activeInvoiceId, extractedData);
      setReconResult(res.reconciliation);
      onRefreshData();

      if (res.reconciliation.status === 'MATCHED') {
        confetti({ particleCount: 70, spread: 60 });
        onAddToast({
          type: 'success',
          title: 'Reconciliation Succeeded!',
          message: 'Invoice now matches 100% after field corrections.'
        });
      } else {
        onAddToast({
          type: 'info',
          title: 'Reconciliation Updated',
          message: `Current Status: ${res.reconciliation.status}`
        });
      }
    } catch (err: any) {
      onAddToast({ type: 'error', title: 'Correction Error', message: err.message });
    } finally {
      setSavingCorrection(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          Invoice Ingestion & Extraction Engine
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Upload supplier tax invoices in PDF, PNG, or JPG formats. Extracts header data, detects corrupt structures, and auto-matches against Purchase Orders.
        </p>
      </div>

      {/* Quick Test Samples Banner */}
      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Academic QA Evaluation Dataset
          </span>
          <p className="text-xs text-slate-300 mt-0.5">
            Evaluate the real PDF parser with the attached project test specifications:
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleLoadSample('VoltTech_Valid_PO_and_Invoice.pdf', 'Valid Document')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Load Valid Volt-Tech Invoice</span>
          </button>
          <button
            onClick={() => handleLoadSample('VoltTech_Corrupt_QA_Test.pdf', 'Corrupt Document')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Load Corrupt QA Test Document</span>
          </button>
          <a
            href="/sample-data/VoltTech_Valid_PO_and_Invoice.pdf"
            download
            className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 border border-slate-700 transition-colors"
            title="Download test PDF"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`p-10 rounded-2xl border-2 border-dashed transition-all text-center ${
          dragActive
            ? 'border-indigo-500 bg-indigo-500/10 shadow-glow-purple'
            : 'border-slate-800 bg-[#111827] hover:border-slate-700'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto shadow-md">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-base font-bold text-white mt-4">
          Drag and drop supplier invoice files here
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Supports native PDF invoices, scanned PNG, and JPG images up to 15MB.
        </p>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25 hover:from-indigo-500 hover:to-purple-500 active:scale-95 transition-all"
          >
            Browse Local Files
          </button>
        </div>

        {uploading && (
          <div className="mt-6 max-w-md mx-auto space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                Parsing document structure & line items...
              </span>
              <span className="font-mono">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Extracted Data Verification & Correction Editor */}
      {extractedData && (
        <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-800 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Extraction Results & Correction Table
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                Extracted Fields: {extractedData.invoice_number}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-400">Extraction Confidence:</span>
                <span
                  className={`font-bold ${
                    extractedData.confidence >= 90
                      ? 'text-emerald-400'
                      : extractedData.confidence >= 60
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {extractedData.confidence}%
                </span>
              </div>

              {reconResult && (
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                    reconResult.status === 'MATCHED'
                      ? 'badge-matched'
                      : reconResult.status === 'PARTIAL_MATCH'
                      ? 'badge-partial'
                      : reconResult.status === 'CORRUPT'
                      ? 'badge-corrupt'
                      : 'badge-mismatch'
                  }`}
                >
                  Recon Status: {reconResult.status}
                </span>
              )}
            </div>
          </div>

          {/* Anomaly & Corrupt Warning Banner */}
          {extractedData.corruptFlags && extractedData.corruptFlags.length > 0 && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-1">
              <h4 className="text-xs font-bold text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Document Integrity Flags Detected
              </h4>
              <ul className="list-disc list-inside text-xs text-red-300 space-y-0.5">
                {extractedData.corruptFlags.map((flag: string, i: number) => (
                  <li key={i}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Header Fields Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Invoice Number</label>
              <input
                type="text"
                value={extractedData.invoice_number || ''}
                onChange={(e) => setExtractedData({ ...extractedData, invoice_number: e.target.value })}
                className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Order Ref / PO Number</label>
              <input
                type="text"
                value={extractedData.po_number || ''}
                onChange={(e) => setExtractedData({ ...extractedData, po_number: e.target.value })}
                className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Supplier Name</label>
              <input
                type="text"
                value={extractedData.supplier || ''}
                onChange={(e) => setExtractedData({ ...extractedData, supplier: e.target.value })}
                className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Invoice Date</label>
              <input
                type="text"
                value={extractedData.invoice_date || ''}
                onChange={(e) => setExtractedData({ ...extractedData, invoice_date: e.target.value })}
                className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Subtotal ($)</label>
              <input
                type="number"
                step="0.01"
                value={extractedData.subtotal ?? 0}
                onChange={(e) => setExtractedData({ ...extractedData, subtotal: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Tax Amount ($)</label>
              <input
                type="number"
                step="0.01"
                value={extractedData.tax_amount ?? 0}
                onChange={(e) => setExtractedData({ ...extractedData, tax_amount: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Shipping ($)</label>
              <input
                type="number"
                step="0.01"
                value={extractedData.shipping ?? 0}
                onChange={(e) => setExtractedData({ ...extractedData, shipping: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Total Amount ($)</label>
              <input
                type="number"
                step="0.01"
                value={extractedData.total_amount ?? 0}
                onChange={(e) => setExtractedData({ ...extractedData, total_amount: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <h4 className="text-xs font-bold text-white mb-3">Extracted Line Items</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#161F33] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Item Description</th>
                    <th className="py-2.5 px-4 w-24">Qty</th>
                    <th className="py-2.5 px-4 w-32">Unit Price ($)</th>
                    <th className="py-2.5 px-4 w-36">Total ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-[#111827]">
                  {extractedData.items && extractedData.items.map((item: any, idx: number) => (
                    <tr key={idx} className={item.isCorrupt ? 'bg-red-500/10' : ''}>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          value={item.item_desc}
                          onChange={(e) => {
                            const newItems = [...extractedData.items];
                            newItems[idx].item_desc = e.target.value;
                            setExtractedData({ ...extractedData, items: newItems });
                          }}
                          className="w-full bg-transparent text-white focus:outline-none focus:bg-slate-800/80 px-2 py-1 rounded"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...extractedData.items];
                            newItems[idx].quantity = parseFloat(e.target.value) || 0;
                            newItems[idx].total_price = newItems[idx].quantity * newItems[idx].unit_price;
                            setExtractedData({ ...extractedData, items: newItems });
                          }}
                          className="w-full bg-transparent text-white focus:outline-none focus:bg-slate-800/80 px-2 py-1 rounded"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="number"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => {
                            const newItems = [...extractedData.items];
                            newItems[idx].unit_price = parseFloat(e.target.value) || 0;
                            newItems[idx].total_price = newItems[idx].quantity * newItems[idx].unit_price;
                            setExtractedData({ ...extractedData, items: newItems });
                          }}
                          className="w-full bg-transparent text-white focus:outline-none focus:bg-slate-800/80 px-2 py-1 rounded"
                        />
                      </td>
                      <td className="py-2 px-4 font-mono font-bold text-slate-200">
                        ${(item.total_price || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <button
              onClick={() => { setExtractedData(null); setReconResult(null); }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Clear & Upload Another
            </button>

            <div className="flex items-center gap-3">
              {reconResult && reconResult.status !== 'MATCHED' && (
                <button
                  onClick={() => onNavigate('review-queue')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition-all flex items-center gap-1.5"
                >
                  <span>Open in Review Queue</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={handleSaveCorrections}
                disabled={savingCorrection}
                className="px-6 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25 hover:from-indigo-500 hover:to-purple-500 active:scale-95 transition-all flex items-center gap-2"
              >
                <GitCompare className="w-4 h-4" />
                <span>{savingCorrection ? 'Re-reconciling...' : 'Save & Re-Reconcile'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
