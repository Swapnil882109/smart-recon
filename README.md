# Smart Recon — Automated Invoice Reconciliation System
**Enterprise Accounts Payable Intelligence & 3-Way Cross-Matching Platform**

Smart Recon is an enterprise-grade financial operations platform engineered to automate invoice processing and reconcile supplier invoices against contracted purchase orders (POs). Built to production SaaS standards for academic final-year project demonstration, Smart Recon replaces error-prone manual line-by-line verification with algorithmic 3-way matching, tolerance governance, anomaly detection, and traceable exception workflows.

---

## 1. Key Capabilities & Architecture

- **Multi-Format Invoice Ingestion**: Accepts PDF, PNG, and JPG invoices. Extracts invoice numbers, PO references, supplier identity, line items, taxes, shipping, and grand totals with confidence scoring.
- **PO Registry & Spreadsheet Import**: Imports purchase orders from Excel (`.xlsx`, `.xls`) and `.csv` files with an interactive **Column Mapper** that adapts to custom header schemas.
- **Configurable 6-Stage 3-Way Reconciliation Engine**:
  1. PO Reference Lookup (exact & normalized matching)
  2. Supplier Identity Verification
  3. Header Amounts & Tax Consistency Check
  4. Line Item Matching (descriptions, quantities, contracted unit prices)
  5. Tolerance Engine (Amount %, Absolute $, Quantity %, and Date window offsets)
  6. Document Sanity & Anomaly Check (detects unparseable dates e.g. `31/13/2026`, non-numeric values like `NaN`, negative quantities, and unapproved price hikes)
- **Manual Review Queue**: Side-by-side PO vs Invoice comparison visualizer with high-contrast discrepancy highlights, reviewer audit notes, override approvals, rejections, and return-to-vendor workflows.
- **Analytics Command Center**: Real-time KPI metrics, processing volume trends (Recharts), status breakdown donuts, and discrepancy root-cause distribution.
- **Compliance & Immutable Audit Logging**: Server-signed activity log recording every sign-in, document ingest, reconciliation run, and review decision with actor timestamps.
- **Executive Reporting & Data Export**: Instant export to CSV and Excel (`.xlsx`) datasets.

---

## 2. Technology Stack

- **Frontend**:
  - React 18 with Vite
  - TypeScript for complete type safety
  - Tailwind CSS for responsive dark financial SaaS styling
  - Lucide React for consistent financial iconography
  - Recharts for interactive analytics visualizations
  - Canvas Confetti for reconciliation success celebrations
- **Backend**:
  - Node.js & Express.js REST API
  - Pure WebAssembly SQLite (`sql.js`) with ACID transactions and persistent disk sync (`smart_recon.sqlite`)
  - `pdf-parse` for native PDF text stream analysis and line-item extraction
  - `xlsx` for Excel and CSV spreadsheet processing
  - `bcryptjs` for salted password hashing
  - `jsonwebtoken` for secure JWT session tokens
  - `multer` for multi-format document uploads

---

## 3. Pre-Configured Demo Accounts

For rapid demonstration and evaluation, the database is pre-seeded with 3 role-based accounts (or you can use the **1-Click Demo Login** buttons on the sign-in modal):

| Role | Email | Password | Access Privileges |
|---|---|---|---|
| **Finance Admin** | `admin@smartrecon.io` | `Password@123` | Full administrative control & tolerance settings |
| **Finance Reviewer** | `reviewer@smartrecon.io` | `Password@123` | Exception review, overrides & reconciliation |
| **Auditor** | `auditor@smartrecon.io` | `Password@123` | Read-only compliance logs & reporting |

---

## 4. Test Data & QA Specification Documents

The platform includes test assets located in `./sample-data/`:

1. **`VoltTech_Valid_PO_and_Invoice.pdf`**:
   - Contains approved PO `ORD-88412` and tax invoice `INV-2026-9910` from Volt-Tech Electricals ($2,445.40).
   - Expected Result: **100% MATCHED** with 0 discrepancies.
2. **`VoltTech_Corrupt_QA_Test.pdf`**:
   - Contains corrupted QA failure specifications (unparseable date `31/13/2026`, missing PO ID, negative quantity `-2`, `NaN` row total, wrong sum).
   - Expected Result: **CORRUPT / QA FAILURE** assertion triggered.
3. **`Purchase_Orders_Standard.xlsx`**:
   - Standard Excel purchase order dataset ready for batch import.
4. **`Purchase_Orders_Custom_Headers.csv`**:
   - CSV dataset using custom column headers (`Order_Ref`, `Vendor_Name`, `Ordered_Qty`) to demonstrate the interactive Column Mapper.

---

## 5. Quick Start & Execution Instructions

### Prerequisites
- Node.js v18+ (tested on Node v24)
- npm v10+

### Step 1: Install Dependencies
```bash
# In the project root:
cd server && npm install
cd ../client && npm install
```

### Step 2: Run the Automated Integration Test Suite
```bash
cd server
node scripts/test-workflows.js
```
*Executes 25 unit and integration assertions testing database persistence, extraction, matching logic, and audit logging.*

### Step 3: Launch the Full Application
```bash
# Option A: Run the unified full-stack server (serves frontend + API on port 5001)
cd server
node src/index.js

# Option B: Run development servers concurrently
# Terminal 1 (Backend API on port 5001):
cd server
npm run dev

# Terminal 2 (Vite Frontend on port 5173):
cd client
npm run dev
```

Open your browser to:
- **Unified Application**: `http://localhost:5001`
- **Vite Dev Server**: `http://localhost:5173`
- **API Health Check**: `http://localhost:5001/api/health`

---

## 6. Verification of Deliverables

- [x] Public marketing landing page with interactive 4-step workflow, features, and contact form
- [x] Authentication with JWT, salted bcrypt hashing, and quick demo role switching
- [x] Responsive financial analytics dashboard with 5 KPI cards and Recharts visualizations
- [x] Multi-format upload hub (PDF, PNG, JPG) with real text extraction and editable correction table
- [x] Purchase order management with Excel/CSV import and smart column mapping
- [x] 6-stage reconciliation engine with configurable amount, quantity, and date tolerances
- [x] Manual Review Queue with high-contrast side-by-side diff visualizer and auditable decisions
- [x] Searchable invoices directory and detailed item modals
- [x] Executive reports with instant CSV and Excel exports
- [x] Immutable activity audit log tracking actor identities, IP addresses, and timestamps
- [x] Comprehensive test suite with 25 passing test assertions
