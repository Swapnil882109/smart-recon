import React from 'react';
import {
  Search,
  Bell,
  UploadCloud,
  GitCompare,
  UserCheck,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import { User, NotificationItem } from '../types';

interface NavbarProps {
  user: User | null;
  onSwitchRole: (role: 'Admin' | 'Finance Reviewer' | 'Auditor') => void;
  onNavigate: (view: string) => void;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
  onBatchReconcile: () => void;
  isReconciling: boolean;
  collapsed: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSwitchRole,
  onNavigate,
  notifications,
  onOpenNotifications,
  onSearchChange,
  searchQuery,
  onBatchReconcile,
  isReconciling,
  collapsed,
}) => {
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header
      className={`fixed top-0 right-0 h-16 z-20 transition-all duration-300 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between ${
        collapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Search Input */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice #, PO #, vendor, line items..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#111827] border border-slate-800/80 rounded-xl pl-10 pr-12 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/60 font-mono">
            /
          </kbd>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Batch Reconcile Button */}
        <button
          onClick={onBatchReconcile}
          disabled={isReconciling}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
        >
          <GitCompare className={`w-3.5 h-3.5 ${isReconciling ? 'animate-spin' : ''}`} />
          {isReconciling ? 'Running Matching...' : 'Run Auto-Reconcile'}
        </button>

        {/* Quick Upload Invoice Button */}
        <button
          onClick={() => onNavigate('upload')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20 hover:from-indigo-500 hover:to-purple-500 active:scale-95 transition-all"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload Invoice</span>
        </button>

        {/* Demo Role Switcher Dropdown */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 transition-colors">
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline text-slate-400">Role:</span>
            <span className="font-semibold text-white">{user?.role || 'Reviewer'}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          <div className="absolute right-0 mt-2 w-56 py-2 bg-[#161F33] border border-slate-800 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Switch Role
            </div>
            <button
              onClick={() => onSwitchRole('Admin')}
              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/60 ${
                user?.role === 'Admin' ? 'text-indigo-400 font-bold bg-indigo-500/10' : 'text-slate-300'
              }`}
            >
              <span>Alex Morgan (Admin)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">Full</span>
            </button>
            <button
              onClick={() => onSwitchRole('Finance Reviewer')}
              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/60 ${
                user?.role === 'Finance Reviewer' ? 'text-indigo-400 font-bold bg-indigo-500/10' : 'text-slate-300'
              }`}
            >
              <span>Sarah Jenkins (Reviewer)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">Reviews</span>
            </button>
            <button
              onClick={() => onSwitchRole('Auditor')}
              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/60 ${
                user?.role === 'Auditor' ? 'text-indigo-400 font-bold bg-indigo-500/10' : 'text-slate-300'
              }`}
            >
              <span>David Chen (Auditor)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Read/Log</span>
            </button>
          </div>
        </div>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#0B0F19]" />
          )}
        </button>
      </div>
    </header>
  );
};
