import React, { useState } from 'react';
import {
  ShieldCheck,
  FileCheck,
  GitCompare,
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Cpu,
  BarChart2,
  Sparkles,
  ChevronDown,
  HelpCircle,
  Mail,
  Send,
  ExternalLink
} from 'lucide-react';

interface LandingPageProps {
  onOpenSignIn: () => void;
  onOpenRegister: () => void;
  onEnterApp: () => void;
  onShowLegal: (type: 'terms' | 'privacy') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenSignIn,
  onOpenRegister,
  onEnterApp,
  onShowLegal,
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setContactSubmitted(true);
  };

  const faqs = [
    {
      q: 'How does Smart Recon match invoices against purchase orders?',
      a: 'Smart Recon uses a configurable 6-stage cross-matching engine. It inspects PO references, verifies normalized supplier identities, matches line item descriptions, compares invoiced vs contracted quantities and rates, and checks header arithmetic. Discrepancies are weighed against user-defined tolerances.'
    },
    {
      q: 'What file formats can be uploaded for invoice extraction?',
      a: 'The system natively accepts PDF, PNG, and JPG invoices. It extracts structured text, item descriptions, rates, dates, tax amounts, and totals, detecting corrupt formats, negative amounts, and arithmetic flaws.'
    },
    {
      q: 'Can purchase orders be imported from our existing spreadsheets?',
      a: 'Yes. Smart Recon includes an interactive Excel and CSV import wizard with an intelligent Column Mapper. It accommodates different header naming conventions (e.g. OrderRef vs PO_Number).'
    },
    {
      q: 'How are reconciliation discrepancies resolved?',
      a: 'Flagged mismatches are automatically routed to the Manual Review Queue. Finance reviewers inspect a high-contrast side-by-side comparison of the PO and invoice, and can record auditable decisions (Approve Override, Reject, or Return to Vendor).'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sticky Navbar */}
      <header className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                Smart<span className="text-indigo-400">Recon</span>
              </span>
              <p className="text-[10px] text-slate-400 tracking-wide font-medium">Automated Invoice Reconciliation</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-indigo-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-400 transition-colors">How It Works</a>
            <a href="#benefits" className="hover:text-indigo-400 transition-colors">Benefits</a>
            <a href="#about" className="hover:text-indigo-400 transition-colors">About</a>
            <a href="#contact" className="hover:text-indigo-400 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSignIn}
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={onEnterApp}
              className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/25 hover:from-indigo-500 hover:to-purple-500 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-indigo-600/15 via-purple-600/10 to-transparent blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Academic Final-Year Project Demonstration Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Automate Invoice Reconciliation. <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Eliminate Manual Finance Work.
            </span>
          </h1>

          <p className="mt-6 text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Smart Recon continuously compares supplier invoices against contracted purchase orders, catches line-item price hikes and quantity overbilling, enforces enterprise tolerance rules, and streamlines financial review workflows.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onEnterApp}
              className="px-7 py-3.5 rounded-xl text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 active:scale-95 transition-all flex items-center gap-2.5"
            >
              <span>Explore Live Platform</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onOpenRegister}
              className="px-7 py-3.5 rounded-xl text-base font-bold bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 active:scale-95 transition-all"
            >
              Create Account
            </button>
          </div>

          {/* Interactive Preview Mockup */}
          <div className="mt-16 rounded-2xl border border-slate-800 bg-[#111827] p-4 shadow-2xl shadow-indigo-950/40 relative">
            <div className="rounded-xl bg-[#0e1422] border border-slate-800 p-6 text-left">
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-800 gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Live 3-Way Match Verification</span>
                  <h3 className="text-lg font-bold text-white mt-1">Invoice INV-2026-9910 vs PO ORD-88412</h3>
                  <p className="text-xs text-slate-400">Supplier: Volt-Tech Electricals | Date: Oct 14, 2026</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    100% MATCHED
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                    Discrepancy: $0.00
                  </span>
                </div>
              </div>

              {/* Table preview */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800/80">
                      <th className="py-2.5">Line Description</th>
                      <th className="py-2.5">PO Qty</th>
                      <th className="py-2.5">Inv Qty</th>
                      <th className="py-2.5">PO Rate</th>
                      <th className="py-2.5">Inv Rate</th>
                      <th className="py-2.5 text-right">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-300">
                    <tr>
                      <td className="py-2.5 font-medium text-white">Industrial Heavy Stabilizer 10kVA</td>
                      <td className="py-2.5">2</td>
                      <td className="py-2.5">2</td>
                      <td className="py-2.5">$450.00</td>
                      <td className="py-2.5">$450.00</td>
                      <td className="py-2.5 text-right text-emerald-400 font-bold">$0.00 (Match)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium text-white">Commercial Ceiling Fan 56"</td>
                      <td className="py-2.5">10</td>
                      <td className="py-2.5">10</td>
                      <td className="py-2.5">$65.00</td>
                      <td className="py-2.5">$65.00</td>
                      <td className="py-2.5 text-right text-emerald-400 font-bold">$0.00 (Match)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium text-white">Modular Circuit Breaker Panel 12-Way</td>
                      <td className="py-2.5">4</td>
                      <td className="py-2.5">4</td>
                      <td className="py-2.5">$120.00</td>
                      <td className="py-2.5">$120.00</td>
                      <td className="py-2.5 text-right text-emerald-400 font-bold">$0.00 (Match)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 border-t border-slate-800/80 bg-[#0e1422]/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Comprehensive Capabilities</span>
            <h2 className="text-3xl font-extrabold text-white mt-2">Engineered for Accounts Payable Accuracy</h2>
            <p className="text-slate-400 text-sm mt-3">Smart Recon provides real algorithmic reconciliation, not simulated screenshots or static tables.</p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: UploadCloud,
                title: 'Multi-Format Extraction',
                desc: 'Accepts PDF, PNG, and JPG invoices. Extracts invoice number, PO reference, line items, and taxes with confidence scoring.'
              },
              {
                icon: GitCompare,
                title: '3-Way PO Matching',
                desc: 'Cross-checks invoice details against contracted Purchase Orders, verifying quantities, unit prices, and row math.'
              },
              {
                icon: Cpu,
                title: 'Configurable Tolerances',
                desc: 'User-defined thresholds for amount deviation ($ and %), allowable quantity variances, and delivery date offsets.'
              },
              {
                icon: AlertTriangle,
                title: 'Mismatch & Anomaly Detection',
                desc: 'Detects intentional corruptions, unparseable dates (e.g. 31/13/2026), negative quantities, and unapproved price hikes.'
              },
              {
                icon: CheckCircle2,
                title: 'Manual Review Queue',
                desc: 'Structured workflow with side-by-side PO vs Invoice diff viewer, reviewer audit notes, approvals, and rejections.'
              },
              {
                icon: FileSpreadsheet,
                title: 'Excel & CSV Mapper',
                desc: 'Imports bulk PO datasets with interactive column mapping to adapt to diverse ERP export formats.'
              },
              {
                icon: BarChart2,
                title: 'Analytics & Reporting',
                desc: 'Interactive monthly trends, discrepancy breakdowns, vendor compliance ratings, and one-click CSV / Excel exports.'
              },
              {
                icon: Lock,
                title: 'Role-Based Access Control',
                desc: 'Secures financial operations with distinct permissions for Admins, Reviewers, and external Auditors.'
              }
            ].map((f, idx) => {
              const Icon = f.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-[#111827] border border-slate-800 hover:border-indigo-500/40 transition-all group"
                >
                  <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mt-4">{f.title}</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Workflow Architecture</span>
            <h2 className="text-3xl font-extrabold text-white mt-2">Four Steps from Document to Clearance</h2>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Upload Documents',
                desc: 'Drop PDF, PNG, or JPG invoices and import PO registries via Excel/CSV spreadsheets.'
              },
              {
                step: '02',
                title: 'Extract & Validate',
                desc: 'Automated extraction engine parses headers, line items, and tests for corrupt structures.'
              },
              {
                step: '03',
                title: '3-Way Reconciliation',
                desc: 'Compares invoice against approved PO, applying configured tolerances and detecting variances.'
              },
              {
                step: '04',
                title: 'Audit & Resolve',
                desc: 'Clear compliant invoices automatically or review exceptions side-by-side with full audit trail.'
              }
            ].map((st, i) => (
              <div key={i} className="p-6 rounded-2xl bg-[#111827] border border-slate-800 relative">
                <span className="text-3xl font-extrabold text-indigo-500/30">{st.step}</span>
                <h3 className="text-base font-bold text-white mt-2">{st.title}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 border-t border-slate-800/80 bg-[#0e1422]/60">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Business Impact</span>
            <h2 className="text-3xl font-extrabold text-white mt-2">Built for Accuracy & Traceability</h2>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 flex items-start gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Elimination of Manual Line-by-Line Checks</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Finance teams no longer need to manually reconcile each line item and extended price against paper POs. Automated algorithms flag exact variances in seconds.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 flex items-start gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Full Financial Compliance & Audit Trail</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Every reconciliation run, tolerance rule applied, manual override decision, and review timestamp is immutably logged for internal and external auditors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">System Purpose</span>
          <h2 className="text-3xl font-extrabold text-white mt-2">About Smart Recon</h2>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed text-left sm:text-center">
            Smart Recon is an enterprise-grade automated invoice reconciliation platform designed to address the inefficiencies, error rates, and overbilling risks associated with manual accounts payable workflows. By pairing document extraction with cross-relational 3-way matching and tolerance logic, the system provides a scalable, auditable, and transparent environment for modern corporate finance teams.
          </p>
        </div>
      </section>

      {/* FAQ & Contact Section */}
      <section id="contact" className="py-24 border-t border-slate-800/80 bg-[#0e1422]/60">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* FAQ Accordion */}
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Common Questions</span>
            <h2 className="text-2xl font-extrabold text-white mt-1">Frequently Asked Questions</h2>

            <div className="mt-8 space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="rounded-xl bg-[#111827] border border-slate-800 overflow-hidden">
                  <button
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className="w-full p-4 text-left flex items-center justify-between text-sm font-semibold text-white hover:text-indigo-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${activeFaq === i ? 'rotate-180 text-indigo-400' : 'text-slate-500'}`} />
                  </button>
                  {activeFaq === i && (
                    <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div className="p-8 rounded-2xl bg-[#111827] border border-slate-800">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Inquiries & Support</span>
            <h2 className="text-2xl font-extrabold text-white mt-1">Contact Operations Team</h2>
            <p className="text-xs text-slate-400 mt-2">Have a question regarding reconciliation rules or platform deployment? Reach out to our technical team.</p>

            {contactSubmitted ? (
              <div className="mt-8 p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white">Message Dispatched Successfully</h4>
                <p className="text-xs text-slate-300 mt-1">Our accounts payable technical specialist will respond within 24 hours.</p>
                <button
                  onClick={() => setContactSubmitted(false)}
                  className="mt-4 px-4 py-1.5 text-xs font-bold text-emerald-400 hover:underline"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Sarah Jenkins"
                    className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="sarah.jenkins@enterprise.com"
                    className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Subject</label>
                  <input
                    type="text"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    placeholder="Invoice tolerance inquiry"
                    className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Message</label>
                  <textarea
                    rows={4}
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Describe your inquiry..."
                    className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25 hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Inquiry</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-[#0B0F19] py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-white">Smart Recon</span>
              <p className="text-[11px] text-slate-500">Automated Financial Operations & Reconciliation Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <button onClick={() => onShowLegal('privacy')} className="hover:text-white transition-colors">
              Privacy Policy
            </button>
            <button onClick={() => onShowLegal('terms')} className="hover:text-white transition-colors">
              Terms of Service
            </button>
            <a href="#about" className="hover:text-white transition-colors">
              System Architecture
            </a>
            <button onClick={onEnterApp} className="text-indigo-400 font-semibold hover:underline">
              Enter Console
            </button>
          </div>

          <p className="text-xs text-slate-500">
            &copy; 2026 Smart Recon. Final-Year Academic Project.
          </p>
        </div>
      </footer>
    </div>
  );
};
