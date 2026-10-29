const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const sampleDir = path.join(__dirname, '../../sample-data');
if (!fs.existsSync(sampleDir)) {
  fs.mkdirSync(sampleDir, { recursive: true });
}

// 1. Standard PO Spreadsheet
const poData = [
  { 'PO Number': 'ORD-88412', 'Supplier': 'Volt-Tech Electricals', 'Order Date': '2026-10-14', 'Item Description': 'Industrial Heavy Stabilizer 10kVA', 'Quantity': 2, 'Unit Price': 450.00, 'Subtotal': 900.00, 'Tax Rate': 0.18, 'Tax Amount': 162.00, 'Shipping': 25.00, 'Total Value': 1087.00, 'Currency': 'USD', 'Status': 'Approved' },
  { 'PO Number': 'ORD-88412', 'Supplier': 'Volt-Tech Electricals', 'Order Date': '2026-10-14', 'Item Description': 'Commercial Ceiling Fan 56"', 'Quantity': 10, 'Unit Price': 65.00, 'Subtotal': 650.00, 'Tax Rate': 0.18, 'Tax Amount': 117.00, 'Shipping': 15.00, 'Total Value': 782.00, 'Currency': 'USD', 'Status': 'Approved' },
  { 'PO Number': 'ORD-88412', 'Supplier': 'Volt-Tech Electricals', 'Order Date': '2026-10-14', 'Item Description': 'Modular Circuit Breaker Panel 12-Way', 'Quantity': 4, 'Unit Price': 120.00, 'Subtotal': 480.00, 'Tax Rate': 0.18, 'Tax Amount': 86.40, 'Shipping': 10.00, 'Total Value': 576.40, 'Currency': 'USD', 'Status': 'Approved' },
  { 'PO Number': 'ORD-77291', 'Supplier': 'CyberTech Logistics', 'Order Date': '2026-10-10', 'Item Description': 'Rackmount Server Rail Kit 2U', 'Quantity': 5, 'Unit Price': 180.00, 'Subtotal': 900.00, 'Tax Rate': 0.10, 'Tax Amount': 90.00, 'Shipping': 45.00, 'Total Value': 1035.00, 'Currency': 'USD', 'Status': 'Approved' },
  { 'PO Number': 'ORD-65103', 'Supplier': 'Apex Construction Tools', 'Order Date': '2026-10-05', 'Item Description': 'Heavy Duty Hydraulic Jack 20T', 'Quantity': 10, 'Unit Price': 220.00, 'Subtotal': 2200.00, 'Tax Rate': 0.12, 'Tax Amount': 264.00, 'Shipping': 80.00, 'Total Value': 2544.00, 'Currency': 'USD', 'Status': 'Approved' },
  { 'PO Number': 'ORD-91204', 'Supplier': 'Industrial Supplies Co', 'Order Date': '2026-09-28', 'Item Description': 'Pneumatic Impact Wrench Kit', 'Quantity': 8, 'Unit Price': 310.00, 'Subtotal': 2480.00, 'Tax Rate': 0.15, 'Tax Amount': 372.00, 'Shipping': 60.00, 'Total Value': 2912.00, 'Currency': 'USD', 'Status': 'Approved' }
];

const ws1 = XLSX.utils.json_to_sheet(poData);
const wb1 = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb1, ws1, 'Purchase Orders');
XLSX.writeFile(wb1, path.join(sampleDir, 'Purchase_Orders_Standard.xlsx'));

// 2. Custom Headers CSV for Column Mapper Testing
const customCsvData = `Order_Ref,Vendor_Name,Issue_Date,Product_Name,Ordered_Qty,Rate_Per_Unit,Line_Total,Status
ORD-88412,Volt-Tech Electricals,2026-10-14,Industrial Heavy Stabilizer 10kVA,2,450.00,900.00,Verified
ORD-88412,Volt-Tech Electricals,2026-10-14,Commercial Ceiling Fan 56",10,65.00,650.00,Verified
ORD-88412,Volt-Tech Electricals,2026-10-14,Modular Circuit Breaker Panel 12-Way,4,120.00,480.00,Verified
ORD-55420,Nova Steel Solutions,2026-10-18,Galvanized Conduit Piping 2",50,18.50,925.00,Verified
ORD-33910,BioHealth MedTech,2026-10-20,Digital Sterilization Autoclave,1,3400.00,3400.00,Verified
`;

fs.writeFileSync(path.join(sampleDir, 'Purchase_Orders_Custom_Headers.csv'), customCsvData);

console.log('Sample spreadsheets generated successfully in', sampleDir);
