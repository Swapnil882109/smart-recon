import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { NotificationDrawer } from './components/NotificationDrawer';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Modal } from './components/Modal';

import { LandingPage } from './views/LandingPage';
import { AuthModal } from './views/AuthModal';
import { DashboardView } from './views/DashboardView';
import { UploadView } from './views/UploadView';
import { PurchaseOrdersView } from './views/PurchaseOrdersView';
import { ReconciliationView } from './views/ReconciliationView';
import { ReviewQueueView } from './views/ReviewQueueView';
import { InvoicesView } from './views/InvoicesView';
import { ReportsView } from './views/ReportsView';
import { ActivityLogView } from './views/ActivityLogView';
import { SettingsView } from './views/SettingsView';
import { HelpView } from './views/HelpView';

import { api } from './services/api';
import { User, NotificationItem, DashboardStats } from './types';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  // Navigation & View state
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Drawers
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState<boolean>(false);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  // Authenticated user state
  const [user, setUser] = useState<User | null>({
    id: 'user-admin',
    name: 'Alex Morgan',
    email: 'admin@smartrecon.io',
    role: 'Admin',
    organization: 'Volt Enterprise Finance',
  });

  // App data state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [isReconciling, setIsReconciling] = useState<boolean>(false);

  // Toast helper
  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Data fetching
  const refreshStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      console.error('Stats error:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const refreshNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
    } catch (err: any) {
      console.error('Notifications error:', err);
    }
  };

  useEffect(() => {
    refreshStats();
    refreshNotifications();
  }, []);

  // Quick switch role
  const handleSwitchRole = (newRole: 'Admin' | 'Finance Reviewer' | 'Auditor') => {
    const roleData: Record<string, { name: string; email: string }> = {
      Admin: { name: 'Alex Morgan', email: 'admin@smartrecon.io' },
      'Finance Reviewer': { name: 'Sarah Jenkins', email: 'reviewer@smartrecon.io' },
      Auditor: { name: 'David Chen', email: 'auditor@smartrecon.io' },
    };
    const target = roleData[newRole];
    setUser({
      id: `user-${newRole.toLowerCase()}`,
      name: target.name,
      email: target.email,
      role: newRole,
      organization: 'Volt Enterprise Finance',
    });
    addToast({
      type: 'info',
      title: 'Active Role Switched',
      message: `Now operating with ${newRole} privileges as ${target.name}.`,
    });
  };

  // Run Batch Reconciliation
  const handleBatchReconcile = async () => {
    setIsReconciling(true);
    try {
      const res = await api.runAllReconciliations();
      confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
      addToast({
        type: 'success',
        title: 'Batch Reconciliation Completed',
        message: res.message || 'All invoices re-evaluated against purchase orders.',
      });
      refreshStats();
      refreshNotifications();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Batch Reconciliation Failed', message: err.message });
    } finally {
      setIsReconciling(false);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      addToast({ type: 'info', title: 'Notifications Cleared', message: 'All alerts marked as read.' });
    } catch (e) {}
  };

  const handleLogout = () => {
    localStorage.removeItem('smart_recon_token');
    setUser(null);
    setCurrentView('landing');
    addToast({ type: 'info', title: 'Signed Out', message: 'You have exited the platform console.' });
  };

  // Render Public Landing Page
  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
          onOpenSignIn={() => { setAuthMode('signin'); setIsAuthOpen(true); }}
          onOpenRegister={() => { setAuthMode('register'); setIsAuthOpen(true); }}
          onEnterApp={() => setCurrentView('dashboard')}
          onShowLegal={(type) => setLegalModal(type)}
        />
        <AuthModal
          isOpen={isAuthOpen}
          initialMode={authMode}
          onClose={() => setIsAuthOpen(false)}
          onAuthSuccess={(u, token) => {
            setUser(u);
            localStorage.setItem('smart_recon_token', token);
            setCurrentView('dashboard');
          }}
          onAddToast={addToast}
        />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        {/* Legal Modal */}
        {legalModal && (
          <Modal
            isOpen={!!legalModal}
            onClose={() => setLegalModal(null)}
            title={legalModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
            maxWidth="max-w-2xl"
          >
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto">
              <h4 className="font-bold text-white text-sm">Smart Recon Enterprise Governance & Compliance</h4>
              <p>
                Smart Recon is an automated invoice reconciliation and accounts payable financial operations platform. This system implements automated 3-way matching algorithms to ensure vendor invoices accurately conform to contracted purchase orders.
              </p>
              <h5 className="font-bold text-white mt-2">1. Algorithmic Data Validation</h5>
              <p>
                All document parsing (PDF, PNG, JPG) is executed securely within compliant server environments. The system evaluates tolerance rules, date bounds, and math consistency to protect corporate spend.
              </p>
              <h5 className="font-bold text-white mt-2">2. Traceable Decision Audit Trail</h5>
              <p>
                Every manual override, variance approval, or document rejection requires authenticated reviewer sign-off and is immutably logged for financial and compliance auditability.
              </p>
            </div>
          </Modal>
        )}
      </>
    );
  }

  // Render Authenticated Console
  return (
    <div className="min-h-screen bg-[#0B0F19] flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={(v) => setCurrentView(v)}
        pendingReviewsCount={stats?.kpi.pendingReviews.count || 0}
        user={user}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onViewLanding={() => setCurrentView('landing')}
      />

      {/* Main App Layout */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        {/* Top Navbar */}
        <Navbar
          user={user}
          onSwitchRole={handleSwitchRole}
          onNavigate={(v) => setCurrentView(v)}
          notifications={notifications}
          onOpenNotifications={() => setIsNotifDrawerOpen(true)}
          onSearchChange={(q) => setSearchQuery(q)}
          searchQuery={searchQuery}
          onBatchReconcile={handleBatchReconcile}
          isReconciling={isReconciling}
          collapsed={sidebarCollapsed}
        />

        {/* Dynamic View Body */}
        <main className="flex-1 pt-20 pb-12">
          {currentView === 'dashboard' && (
            <DashboardView
              stats={stats}
              loading={loadingStats}
              onRefresh={refreshStats}
              onNavigate={(v) => setCurrentView(v)}
              onBatchReconcile={handleBatchReconcile}
              isReconciling={isReconciling}
            />
          )}

          {currentView === 'upload' && (
            <UploadView
              onAddToast={addToast}
              onNavigate={(v) => setCurrentView(v)}
              onRefreshData={() => { refreshStats(); refreshNotifications(); }}
            />
          )}

          {currentView === 'purchase-orders' && (
            <PurchaseOrdersView
              onAddToast={addToast}
              onNavigate={(v) => setCurrentView(v)}
            />
          )}

          {currentView === 'reconciliation' && (
            <ReconciliationView
              onAddToast={addToast}
              onNavigate={(v) => setCurrentView(v)}
              isReconciling={isReconciling}
              onBatchReconcile={handleBatchReconcile}
            />
          )}

          {currentView === 'review-queue' && (
            <ReviewQueueView
              onAddToast={addToast}
              onRefreshData={() => { refreshStats(); refreshNotifications(); }}
              user={user}
            />
          )}

          {currentView === 'invoices' && (
            <InvoicesView
              onAddToast={addToast}
              onNavigate={(v) => setCurrentView(v)}
            />
          )}

          {currentView === 'reports' && (
            <ReportsView onAddToast={addToast} />
          )}

          {currentView === 'activity' && (
            <ActivityLogView onAddToast={addToast} />
          )}

          {currentView === 'settings' && (
            <SettingsView user={user} onAddToast={addToast} />
          )}

          {currentView === 'help' && (
            <HelpView onAddToast={addToast} />
          )}
        </main>
      </div>

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onNavigate={(v) => setCurrentView(v)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(u, token) => {
          setUser(u);
          localStorage.setItem('smart_recon_token', token);
        }}
        onAddToast={addToast}
      />

      {/* Toast Feedback */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
