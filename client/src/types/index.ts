export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Finance Reviewer' | 'Auditor';
  organization: string;
}

export interface PurchaseOrderItem {
  id: string;
  po_id: string;
  item_desc: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax_rate?: number;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier: string;
  order_date: string;
  subtotal: number;
  tax_amount: number;
  shipping: number;
  total_amount: number;
  currency: string;
  status: string;
  created_at?: string;
  item_count?: number;
  related_invoice_count?: number;
  items?: PurchaseOrderItem[];
  relatedInvoices?: any[];
}

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  item_desc: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  isCorrupt?: boolean;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  po_number?: string;
  supplier: string;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  tax_amount: number;
  shipping: number;
  total_amount: number;
  currency: string;
  status: 'Uploaded' | 'Processing' | 'Reconciled' | 'Review Required' | 'Rejected' | 'Returned' | 'Failed';
  extracted_raw?: string;
  document_url?: string;
  file_type?: string;
  review_status?: string;
  reviewer_id?: string;
  reviewer_notes?: string;
  created_at?: string;
  recon_id?: string;
  recon_status?: 'MATCHED' | 'PARTIAL_MATCH' | 'MISMATCH' | 'REVIEW_REQUIRED' | 'CORRUPT';
  confidence_score?: number;
  discrepancy_amount?: number;
  items?: InvoiceItem[];
  discrepancies?: Discrepancy[];
}

export interface Discrepancy {
  id: string;
  reconciliation_id: string;
  field_name: string;
  expected_value: string;
  actual_value: string;
  variance_amount: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
}

export interface Reconciliation {
  id: string;
  invoice_id: string;
  po_id?: string;
  status: 'MATCHED' | 'PARTIAL_MATCH' | 'MISMATCH' | 'REVIEW_REQUIRED' | 'CORRUPT';
  confidence_score: number;
  discrepancy_amount: number;
  tolerance_rules_applied?: string;
  reconciliation_date: string;
  notes?: string;
  invoice_number?: string;
  invoice_supplier?: string;
  invoice_total?: number;
  invoice_date?: string;
  po_number?: string;
  po_supplier?: string;
  po_total?: number;
  po_date?: string;
  discrepancy_count?: number;
  discrepancies?: Discrepancy[];
  invoiceItems?: InvoiceItem[];
  poItems?: PurchaseOrderItem[];
}

export interface ActivityLog {
  id: string;
  user_name: string;
  user_role: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details: string;
  ip_address?: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  link?: string;
  is_read: number;
  created_at: string;
}

export interface DashboardStats {
  kpi: {
    totalInvoices: number;
    totalVolume: number;
    matched: { count: number; value: number; rate: number };
    partial: { count: number; value: number };
    mismatch: { count: number; value: number };
    pendingReviews: { count: number; value: number };
  };
  distribution: Array<{ name: string; status: string; value: number; color: string }>;
  monthlyTrends: Array<{ month: string; volume: number; matched: number; discrepancies: number; invoices: number }>;
  categoryDiscrepancies: Array<{ category: string; count: number; severity: string; color: string }>;
  recentActivity: ActivityLog[];
  topSuppliers: Array<{ supplier: string; invoice_count: number; total_spend: number }>;
}
