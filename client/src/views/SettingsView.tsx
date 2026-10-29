import React, { useState, useEffect } from 'react';
import {
  Sliders,
  ShieldCheck,
  User,
  Lock,
  Building,
  Save,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { User as UserType } from '../types';

interface SettingsViewProps {
  user: UserType | null;
  onAddToast: (toast: any) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onAddToast }) => {
  const [activeTab, setActiveTab] = useState<'reconciliation' | 'security' | 'profile'>('reconciliation');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Reconciliation settings
  const [tolerances, setTolerances] = useState({
    amount_tolerance_percent: '1.0',
    amount_tolerance_absolute: '10.00',
    quantity_tolerance_percent: '0.0',
    date_tolerance_days: '15',
    strict_line_items: 'true',
    auto_match_on_upload: 'true',
    require_approval_mismatch: 'true',
  });

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.getSettings();
      if (res.settings) {
        setTolerances((prev) => ({ ...prev, ...res.settings }));
      }
    } catch (err: any) {
      onAddToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveTolerances = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings(tolerances);
      onAddToast({ type: 'success', title: 'Settings Saved', message: 'Reconciliation tolerances updated successfully.' });
    } catch (err: any) {
      onAddToast({ type: 'error', title: 'Save Failed', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      onAddToast({ type: 'error', title: 'Mismatch', message: 'New passwords do not match.' });
      return;
    }
    setSaving(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      onAddToast({ type: 'success', title: 'Password Updated', message: 'Your password was changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      onAddToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          System Settings & Governance
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure financial variance thresholds, tolerance rules, and account security.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'reconciliation'
              ? 'text-indigo-400 border-b-2 border-indigo-500 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Reconciliation Tolerances</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'security'
              ? 'text-indigo-400 border-b-2 border-indigo-500 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security & Password</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'text-indigo-400 border-b-2 border-indigo-500 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>User Profile</span>
        </button>
      </div>

      {/* Tab 1: Tolerances */}
      {activeTab === 'reconciliation' && (
        <form onSubmit={handleSaveTolerances} className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white">Automated Matching Tolerances</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Invoices with variances below these thresholds will be classified as <strong>Partial Match</strong> rather than <strong>Mismatch</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Amount Tolerance (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={tolerances.amount_tolerance_percent}
                onChange={(e) => setTolerances({ ...tolerances, amount_tolerance_percent: e.target.value })}
                className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Allowable percentage variance on total invoice amount.</span>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Absolute Amount Tolerance ($)
              </label>
              <input
                type="number"
                step="0.5"
                value={tolerances.amount_tolerance_absolute}
                onChange={(e) => setTolerances({ ...tolerances, amount_tolerance_absolute: e.target.value })}
                className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Maximum absolute currency variance (e.g. freight adjustments).</span>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Quantity Tolerance (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={tolerances.quantity_tolerance_percent}
                onChange={(e) => setTolerances({ ...tolerances, quantity_tolerance_percent: e.target.value })}
                className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">0% requires strict exact quantity matching.</span>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Date Window Tolerance (Days)
              </label>
              <input
                type="number"
                value={tolerances.date_tolerance_days}
                onChange={(e) => setTolerances({ ...tolerances, date_tolerance_days: e.target.value })}
                className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Maximum days elapsed between PO creation and invoice issue date.</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="strict_line"
                checked={tolerances.strict_line_items === 'true'}
                onChange={(e) => setTolerances({ ...tolerances, strict_line_items: e.target.checked ? 'true' : 'false' })}
                className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
              />
              <label htmlFor="strict_line" className="text-xs text-slate-300">
                <strong>Enforce Strict Line-Item Matching:</strong> Disallow invoice clearance if any line item description does not match PO schedules.
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="auto_match"
                checked={tolerances.auto_match_on_upload === 'true'}
                onChange={(e) => setTolerances({ ...tolerances, auto_match_on_upload: e.target.checked ? 'true' : 'false' })}
                className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
              />
              <label htmlFor="auto_match" className="text-xs text-slate-300">
                <strong>Instant Auto-Reconcile:</strong> Automatically trigger 3-way reconciliation engine immediately upon document upload.
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20 hover:from-indigo-500 hover:to-purple-500 active:scale-95 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Updating Rules...' : 'Save Tolerance Configuration'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Security */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-5 max-w-lg">
          <div>
            <h3 className="text-sm font-bold text-white">Update Password</h3>
            <p className="text-xs text-slate-400 mt-0.5">Ensure your account is protected with a secure password.</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>{saving ? 'Updating...' : 'Update Password'}</span>
          </button>
        </form>
      )}

      {/* Tab 3: Profile */}
      {activeTab === 'profile' && (
        <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-4 max-w-lg text-xs">
          <div>
            <h3 className="text-sm font-bold text-white">Profile Details</h3>
            <p className="text-slate-400 mt-0.5">Your current authenticated session attributes.</p>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <span className="text-slate-400 block mb-0.5">Full Name</span>
              <span className="text-white font-semibold text-sm">{user?.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Work Email</span>
              <span className="text-white font-semibold">{user?.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Enterprise Organization</span>
              <span className="text-white font-semibold">{user?.organization}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Assigned Security Role</span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold inline-block border border-indigo-500/30">
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
