const XLSX = require('xlsx');

function parseSpreadsheet(fileBuffer, originalName) {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Raw array of rows
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (rawRows.length === 0) {
    throw new Error('Spreadsheet appears to be empty.');
  }

  // Header row is row 0
  const headers = rawRows[0].map(h => String(h || '').trim()).filter(Boolean);
  const rows = XLSX.utils.sheet_to_json(worksheet);

  // Auto-detect standard column mappings
  const detectedMapping = {
    po_number: findMatchingHeader(headers, ['po number', 'po_number', 'ponumber', 'order ref', 'order_ref', 'orderref', 'po #', 'p.o.']),
    supplier: findMatchingHeader(headers, ['supplier', 'vendor', 'vendor_name', 'supplier name', 'company', 'merchant']),
    order_date: findMatchingHeader(headers, ['order date', 'order_date', 'date', 'issue_date', 'po date']),
    item_desc: findMatchingHeader(headers, ['item description', 'item_desc', 'description', 'product', 'product_name', 'item name', 'item']),
    quantity: findMatchingHeader(headers, ['quantity', 'qty', 'ordered_qty', 'units', 'count']),
    unit_price: findMatchingHeader(headers, ['unit price', 'unit_price', 'price', 'rate', 'rate_per_unit', 'cost']),
    total_amount: findMatchingHeader(headers, ['total value', 'total', 'line_total', 'total_amount', 'subtotal', 'amount'])
  };

  return {
    sheetName,
    headers,
    rowCount: rows.length,
    detectedMapping,
    previewRows: rows.slice(0, 10),
    allRows: rows
  };
}

function findMatchingHeader(headers, candidates) {
  for (const candidate of candidates) {
    const match = headers.find(h => h.toLowerCase().trim() === candidate);
    if (match) return match;
  }
  for (const candidate of candidates) {
    const match = headers.find(h => h.toLowerCase().includes(candidate));
    if (match) return match;
  }
  return '';
}

module.exports = {
  parseSpreadsheet
};
