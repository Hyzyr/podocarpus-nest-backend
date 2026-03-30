const fs = require('fs');
const csv = fs.readFileSync('C:\\Users\\hydyr\\Downloads\\Assets 15.12.2025.csv', 'utf-8');

// Proper CSV parser that handles quoted fields with embedded newlines
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } // escaped quote
        else { inQuotes = false; }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { row.push(field.trim()); field = ''; }
      else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
        if (ch === '\r') i++; // skip \n in \r\n
        row.push(field.trim());
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += ch;
      }
    }
  }
  if (field || row.length > 0) { row.push(field.trim()); rows.push(row); }
  return rows;
}

const allRows = parseCSV(csv);
// First row with many columns is the header
const hdr = allRows[0];
console.log('=== Total columns:', hdr.length, '===\n');
hdr.forEach((h, i) => { if (h) console.log(`  ${i}: ${h}`); });

// Payment month columns - header says:
// Jan.25, PAYMENT METHOD, Feb.25, PAYMENT METHOD, ... Jul.25, PAYMENT METHOD, Aug.25, Sep.25, Oct.25, Nov.25, Dec.25, Jan.26, Feb.26, March.26
// Let me find the exact positions

const months = ['Jan.25','Feb.25','Mar.25','Apr.25','May.25','Jun.25','Jul.25','Aug.25','Sep.25','Oct.25','Nov.25','Dec.25','Jan.26','Feb.26','March.26'];
const monthIdx = {};
months.forEach(m => {
  const idx = hdr.indexOf(m);
  if (idx >= 0) monthIdx[m] = idx;
});
console.log('\n=== Month column indices ===');
console.log(monthIdx);

// Find key columns
const tenantCol = hdr.findIndex(h => h.includes('Tenant Name'));
const startCol = hdr.findIndex(h => h.includes('START DATE'));
const expiryCol = hdr.findIndex(h => h.includes('EXPIRY DATE'));
const annualValCol = hdr.findIndex(h => h === 'AMOUNT' || h === 'ANNUAL RENTAL VALUE');
const flatNoCol = hdr.indexOf('FLAT NO');
const emailCol = hdr.indexOf('email');
const phoneCol = hdr.indexOf('phone number');

console.log('\n=== Key columns ===');
console.log('Tenant:', tenantCol, 'Start:', startCol, 'Expiry:', expiryCol);
console.log('FlatNo:', flatNoCol, 'Email:', emailCol, 'Phone:', phoneCol);

// Now parse each data row (skip header rows 0 and 1)
console.log('\n=== Property Data ===\n');

function parseNum(s) {
  if (!s) return 0;
  return parseFloat(s.replace(/[, ]/g, '')) || 0;
}

function parseDate(s) {
  // Format: DD.MM.YYYY
  if (!s) return null;
  const m = s.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

// Map month strings to ISO-ish dates (mid-month)
const monthDates = {
  'Jan.25': '2025-01-15', 'Feb.25': '2025-02-15', 'Mar.25': '2025-03-15',
  'Apr.25': '2025-04-15', 'May.25': '2025-05-15', 'Jun.25': '2025-06-15',
  'Jul.25': '2025-07-15', 'Aug.25': '2025-08-15', 'Sep.25': '2025-09-15',
  'Oct.25': '2025-10-15', 'Nov.25': '2025-11-15', 'Dec.25': '2025-12-15',
  'Jan.26': '2026-01-15', 'Feb.26': '2026-02-15', 'March.26': '2026-03-15',
};

// Track which row belongs to which property (multi-year contracts span multiple rows)
let currentPropNo = null;

for (let i = 2; i < allRows.length; i++) {
  const row = allRows[i];
  if (!row[0] && !row[flatNoCol]) continue; // skip empty or summary rows

  const no = parseInt(row[0]);
  if (no >= 1 && no <= 29) {
    currentPropNo = no;
  } else if (row[0] && isNaN(no)) {
    // Summary rows like "TOTAL" or indicators
    continue;
  }

  if (!currentPropNo) continue;

  const unit = row[flatNoCol];
  const tenant = row[tenantCol];
  const start = row[startCol];
  const expiry = row[expiryCol];

  // Only process rows that have actual property/tenant data
  if (!tenant && !unit && !no) continue;

  // Get annual rent  
  // Column 17 in second header row is "AMOUNT" for annual rental value
  const annualRentRaw = row[17];
  const annualRent = parseNum(annualRentRaw);

  // Get payments
  const payments = [];
  for (const [month, colIdx] of Object.entries(monthIdx)) {
    const val = parseNum(row[colIdx]);
    if (val > 0) {
      payments.push({ month, date: monthDates[month], amount: val });
    }
  }

  if (tenant || payments.length > 0) {
    console.log(`--- Property ${currentPropNo} (Unit: ${unit || '(continuation)'}) ---`);
    if (tenant) {
      console.log(`  Tenant: ${tenant}`);
      console.log(`  Lease: ${start || 'N/A'} → ${expiry || 'N/A'}`);
      console.log(`  Annual rent: ${annualRent}`);
      if (row[emailCol]) console.log(`  Email: ${row[emailCol]}`);
      if (row[phoneCol]) console.log(`  Phone: ${row[phoneCol]}`);
    }
    if (payments.length > 0) {
      console.log(`  Payments (${payments.length}):`);
      payments.forEach(p => console.log(`    ${p.month} → ${p.date}: ${p.amount} AED`));
      console.log(`  Total paid: ${payments.reduce((s, p) => s + p.amount, 0)} AED`);
    }
    console.log('');
  }
}
