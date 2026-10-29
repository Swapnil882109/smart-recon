import React, { useState } from 'react';
import {
  HelpCircle,
  FileCheck,
  GitCompare,
  AlertTriangle,
  Mail,
  Send,
  CheckCircle2,
  BookOpen,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

interface HelpViewProps {
  onAddToast: (toast: any) => void;
}

export const HelpView: React.FC<HelpViewProps> = ({ onAddToast }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const faqs = [
    {
      q: 'How are invoice items matched against Purchase Order line items?',
      a: 'The engine parses line item descriptions and runs exact and normalized substring similarity against the PO line schedules. Quantities are cross-checked, and unit price variance is calculated to the cent.'
    },
    {
      q: 'What is the distinction between Mismatch and Partial Match?',
      a: 'A Mismatch occurs when critical contract constraints are breached (e.g. unit price inflation, quantity overbilled beyond PO, or supplier mismatch). A Partial Match occurs when the variance is non-critical and falls within the authorized tolerance settings (e.g. a minor freight difference under ±$10.00).'
    },
    {
      q: 'How does Smart Recon handle corrupted documents?',
      a: 'The engine evaluates format integrity assertions. If a document contains unparseable dates (e.g. 00/00/0000 or month 13), non-numeric values like NaN, or negative quantities, it immediately flags a CORRUPT status and isolates the record in the Review Queue.'
    },
    {
      q: 'Can an override decision be audited by external reviewers?',
      a: 'Yes. Every approval, rejection, or return action records the reviewer name, role, precise timestamp, mandatory justification note, and original discrepancy variance in the immutable activity log.'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSubmitted(true);
    onAddToast({ type: 'success', title: 'Message Sent', message: 'Technical support has received your ticket.' });
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          Help & Operational Documentation
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Reference guides, matching logic documentation, and technical support.
        </p>
      </div>

      {/* 3 Step Quick Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold mb-3">
            1
          </div>
          <h3 className="text-sm font-bold text-white">Import Purchase Orders</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Ensure your PO registry is populated either via the Excel/CSV import wizard or manual entry before ingesting supplier invoices.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold mb-3">
            2
          </div>
          <h3 className="text-sm font-bold text-white">Upload Invoices</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Drop PDF, PNG, or JPG invoices. The extraction engine automatically detects lines, totals, and anomalies with confidence scoring.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold mb-3">
            3
          </div>
          <h3 className="text-sm font-bold text-white">Resolve Exceptions</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Examine discrepancies in the Review Queue. Approve allowable variances with audit notes or reject unauthorized price hikes.
          </p>
        </div>
      </div>

      {/* FAQ & Support Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* FAQs */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Frequently Asked Questions</span>
          </h3>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="rounded-xl bg-[#111827] border border-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs font-semibold text-white hover:text-indigo-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${activeFaq === idx ? 'rotate-180 text-indigo-400' : 'text-slate-500'}`} />
                </button>
                {activeFaq === idx && (
                  <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Support Ticket Form */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-purple-400" />
            <span>Contact Technical Support</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">Submit an operational question or report an extraction issue.</p>

          {submitted ? (
            <div className="mt-6 p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-white">Ticket Submitted</h4>
              <p className="text-xs text-slate-300 mt-1">Our technical reconciliation specialist will review your request.</p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-3 text-xs font-bold text-emerald-400 hover:underline"
              >
                Submit another inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Message</label>
                <textarea
                  rows={3}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Support Request</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
