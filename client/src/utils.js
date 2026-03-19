export function fmtEGP(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export function fmtSAR(amount) {
  if (amount == null || amount === 0) return '—';
  return new Intl.NumberFormat('en-SA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount) + ' SAR';
}

export function fmtNum(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en').format(Math.round(amount));
}

export function fmtRate(egp, sar) {
  if (!egp || !sar || sar === 0) return '—';
  return (egp / sar).toFixed(2);
}

export function fmtDate(dateStr) {
  if (!dateStr) return '—';
  if (dateStr.length === 7) {
    const [y, m] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(m) - 1]} ${y}`;
  }
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function pctOf(paid, total) {
  if (!total) return 0;
  return Math.round((paid / total) * 100);
}
