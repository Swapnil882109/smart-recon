import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User, Building, ShieldCheck, ArrowRight, Check } from 'lucide-react';
import { Modal } from '../components/Modal';
import { api } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'register';
  onAuthSuccess: (user: any, token: string) => void;
  onAddToast: (toast: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  onAuthSuccess,
  onAddToast,
}) => {
  const [mode, setMode] = useState<'signin' | 'register' | 'forgot'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState<'Finance Reviewer' | 'Admin' | 'Auditor'>('Finance Reviewer');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const resetState = () => {
    setError('');
    setLoading(false);
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.login(demoEmail, 'Password@123');
      onAuthSuccess(res.user, res.token);
      onAddToast({ type: 'success', title: 'Authenticated', message: `Signed in as ${res.user.name} (${res.user.role})` });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        const res = await api.login(email, password);
        onAuthSuccess(res.user, res.token);
        onAddToast({ type: 'success', title: 'Welcome Back', message: `Logged in as ${res.user.name}` });
        onClose();
      } else if (mode === 'register') {
        if (!termsAccepted) {
          throw new Error('Please accept the Terms of Service to create an account');
        }
        const res = await api.register({ name, email, password, organization, role });
        onAuthSuccess(res.user, res.token);
        onAddToast({ type: 'success', title: 'Account Created', message: 'Your Smart Recon account is active' });
        onClose();
      } else if (mode === 'forgot') {
        const res = await api.forgotPassword(email);
        onAddToast({ type: 'info', title: 'Recovery Token Generated', message: `Dev token: ${res.devResetToken}` });
        setMode('signin');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'signin'
          ? 'Sign in to Smart Recon'
          : mode === 'register'
          ? 'Create Enterprise Account'
          : 'Reset Password'
      }
      subtitle={
        mode === 'signin'
          ? 'Access your accounts payable reconciliation workspace'
          : mode === 'register'
          ? 'Set up your finance team credentials'
          : 'Enter your work email to receive password reset instructions'
      }
      maxWidth="max-w-md"
    >
      {/* Quick Demo Logins Banner */}
      {mode === 'signin' && (
        <div className="mb-6 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <p className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-2">
            One-Click Demo Evaluator Accounts:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@smartrecon.io')}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-white font-medium border border-slate-700 text-center transition-colors"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('reviewer@smartrecon.io')}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-white font-medium border border-slate-700 text-center transition-colors"
            >
              Reviewer
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('auditor@smartrecon.io')}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-white font-medium border border-slate-700 text-center transition-colors"
            >
              Auditor
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 leading-relaxed">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Sarah Jenkins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#161F33] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Organization / Company</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Volt Enterprise Operations"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full bg-[#161F33] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Role</label>
              <select
                value={role}
                onChange={(e: any) => setRole(e.target.value)}
                className="w-full bg-[#161F33] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Finance Reviewer">Finance Reviewer (Exception Handling)</option>
                <option value="Admin">Finance Admin (Full Access)</option>
                <option value="Auditor">Auditor (Compliance & Logs)</option>
              </select>
            </div>
          </>
        )}

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Work Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#161F33] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {mode !== 'forgot' && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => { resetState(); setMode('forgot'); }}
                  className="text-[11px] text-indigo-400 hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#161F33] border border-slate-800 rounded-xl pl-9 pr-10 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {mode === 'register' && (
              <p className="text-[10px] text-slate-400 mt-1">Must be at least 6 characters</p>
            )}
          </div>
        )}

        {mode === 'register' && (
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <label htmlFor="terms" className="text-[11px] text-slate-400 leading-tight">
              I accept the Smart Recon Terms of Service and Privacy Policy.
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25 hover:from-indigo-500 hover:to-purple-500 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>{mode === 'signin' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Switch mode links */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
        {mode === 'signin' ? (
          <p>
            Don't have an enterprise account?{' '}
            <button
              onClick={() => { resetState(); setMode('register'); }}
              className="text-indigo-400 font-bold hover:underline"
            >
              Register here
            </button>
          </p>
        ) : (
          <p>
            Already registered?{' '}
            <button
              onClick={() => { resetState(); setMode('signin'); }}
              className="text-indigo-400 font-bold hover:underline"
            >
              Sign In
            </button>
          </p>
        )}
      </div>
    </Modal>
  );
};
