const API_BASE = '/api';

function getHeaders(isFormData = false): HeadersInit {
  const token = localStorage.getItem('smart_recon_token');
  const headers: HeadersInit = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Auth
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async register(userData: any) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Session invalid');
    return res.json();
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password update failed');
    return data;
  },

  async forgotPassword(email: string) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  // Dashboard
  async getDashboardStats() {
    const res = await fetch(`${API_BASE}/dashboard/stats`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
    return res.json();
  },

  // Invoices
  async getInvoices(params: { status?: string; search?: string } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    const res = await fetch(`${API_BASE}/invoices?${query.toString()}`, { headers: getHeaders() });
    return res.json();
  },

  async getInvoice(id: string) {
    const res = await fetch(`${API_BASE}/invoices/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Invoice not found');
    return res.json();
  },

  async uploadInvoice(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/invoices/upload`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload and process file');
    return data;
  },

  async correctInvoice(id: string, payload: any) {
    const res = await fetch(`${API_BASE}/invoices/${id}/correct`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Correction submission failed');
    return data;
  },

  async deleteInvoice(id: string) {
    const res = await fetch(`${API_BASE}/invoices/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  // Purchase Orders
  async getPurchaseOrders(params: { search?: string; status?: string } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    const res = await fetch(`${API_BASE}/purchase-orders?${query.toString()}`, { headers: getHeaders() });
    return res.json();
  },

  async getPurchaseOrder(id: string) {
    const res = await fetch(`${API_BASE}/purchase-orders/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Purchase Order not found');
    return res.json();
  },

  async parsePoSpreadsheet(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/purchase-orders/parse-file`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to parse spreadsheet');
    return data;
  },

  async importPurchaseOrders(rows: any[], mapping: any) {
    const res = await fetch(`${API_BASE}/purchase-orders/import`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ rows, mapping }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to import purchase orders');
    return data;
  },

  // Reconciliation
  async runReconciliation(invoiceId: string, actorName = 'Alex Morgan', actorRole = 'Reviewer') {
    const res = await fetch(`${API_BASE}/reconciliation/run`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ invoiceId, actorName, actorRole }),
    });
    return res.json();
  },

  async runAllReconciliations() {
    const res = await fetch(`${API_BASE}/reconciliation/run-all`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json();
  },

  async getReconciliations(params: { status?: string } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    const res = await fetch(`${API_BASE}/reconciliation/results?${query.toString()}`, { headers: getHeaders() });
    return res.json();
  },

  async getReconciliation(id: string) {
    const res = await fetch(`${API_BASE}/reconciliation/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Reconciliation record not found');
    return res.json();
  },

  // Reviews
  async getReviewQueue(params: { severity?: string; supplier?: string } = {}) {
    const query = new URLSearchParams();
    if (params.severity) query.append('severity', params.severity);
    if (params.supplier) query.append('supplier', params.supplier);
    const res = await fetch(`${API_BASE}/reviews?${query.toString()}`, { headers: getHeaders() });
    return res.json();
  },

  async submitReviewDecision(payload: {
    invoiceId: string;
    reconciliationId?: string;
    action: 'APPROVE' | 'REJECT' | 'RETURN' | 'RE_RUN';
    reviewerName?: string;
    reason: string;
    notes?: string;
  }) {
    const res = await fetch(`${API_BASE}/reviews/decision`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to record decision');
    return data;
  },

  // Reports
  async getReportsSummary() {
    const res = await fetch(`${API_BASE}/reports/summary`, { headers: getHeaders() });
    return res.json();
  },

  // Activity & Notifications
  async getActivityLogs(params: { action?: string } = {}) {
    const query = new URLSearchParams();
    if (params.action) query.append('action', params.action);
    const res = await fetch(`${API_BASE}/activity/logs?${query.toString()}`, { headers: getHeaders() });
    return res.json();
  },

  async getNotifications() {
    const res = await fetch(`${API_BASE}/activity/notifications`, { headers: getHeaders() });
    return res.json();
  },

  async markNotificationsRead(id?: string) {
    const res = await fetch(`${API_BASE}/activity/notifications/mark-read`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ id }),
    });
    return res.json();
  },

  // Settings
  async getSettings() {
    const res = await fetch(`${API_BASE}/settings`, { headers: getHeaders() });
    return res.json();
  },

  async updateSettings(settings: Record<string, string>) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(settings),
    });
    return res.json();
  },
};
