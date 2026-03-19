import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { api } from '../api';

const FMT = new Intl.NumberFormat('en', { maximumFractionDigits: 0 });
function fmt(n) { return FMT.format(Math.round(n || 0)); }
function fmtDate(d) {
  if (!d) return '';
  if (d.length === 7) {
    const [y, m] = d.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(m) - 1]} ${y}`;
  }
  return d;
}
function rate(egp, sar) {
  if (!egp || !sar) return '—';
  return (egp / sar).toFixed(2);
}
function today() {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ShareUpdate({ onClose }) {
  const [settlement, setSettlement] = useState(null);
  const [paidPayments, setPaidPayments] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    Promise.all([api.getSettlement(), api.getPayments()])
      .then(([s, payments]) => {
        setSettlement(s);
        const paid = payments
          .filter(p => p.status === 'PAID' && p.shared)
          .sort((a, b) => b.date.localeCompare(a.date));
        setPaidPayments(paid);
        // Pre-select the most recent month's payments
        if (paid.length > 0) {
          const latestMonth = paid[0].date;
          const ids = new Set(paid.filter(p => p.date === latestMonth).map(p => p.id));
          setSelected(ids);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // --- Loading / empty states ---
  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="loading-screen">Loading payments...</div>
        </div>
      </div>
    );
  }

  if (!settlement || paidPayments.length === 0) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="empty-state">No shared paid payments to share</div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  // --- Helpers ---
  function togglePayment(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleMonth(monthPayments) {
    const ids = monthPayments.map(p => p.id);
    const allSelected = ids.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      ids.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  }

  // Group payments by month
  const months = [];
  const monthMap = new Map();
  for (const p of paidPayments) {
    if (!monthMap.has(p.date)) {
      monthMap.set(p.date, []);
      months.push(p.date);
    }
    monthMap.get(p.date).push(p);
  }

  const selectedPayments = paidPayments.filter(p => selected.has(p.id));
  const { summary } = settlement;
  const bv50 = summary.bv_total_sar / 2;
  const mv50 = summary.mv_total_sar / 2;
  const bvRemaining = bv50 - summary.bv_ali_transferred;
  const mvRemaining = mv50 - summary.mv_ali_transferred;

  // --- Text builder ---
  function buildText() {
    const lines = ['🏠 Egypt Investments Update', ''];
    if (selectedPayments.length === 1) {
      const p = selectedPayments[0];
      lines.push(`✅ Payment made — ${p.project_name}`);
      lines.push(`📅 ${fmtDate(p.date)} installment`);
      lines.push(`💰 ${fmt(p.egp_amount)} EGP (${fmt(p.sar_transferred)} SAR @ ${rate(p.egp_amount, p.sar_transferred)})`);
    } else {
      lines.push(`✅ ${selectedPayments.length} payments made:`);
      for (const p of selectedPayments) {
        lines.push(`  • ${p.project_name} — ${fmt(p.egp_amount)} EGP (${fmt(p.sar_transferred)} SAR @ ${rate(p.egp_amount, p.sar_transferred)})`);
      }
    }
    lines.push('');
    lines.push('📊 Settlement:');
    lines.push(`- BV remaining: ${fmt(bvRemaining)} SAR`);
    lines.push(`- MV remaining: ${fmt(mvRemaining)} SAR`);
    lines.push(`- Total remaining: ${fmt(summary.ali_remaining)} SAR`);
    lines.push('');
    lines.push('Full details: https://egypt.almordi.com');
    return lines.join('\n');
  }

  // --- Actions ---
  async function handleDownload() {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = `egypt-update-${selectedPayments[0]?.date || 'share'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setGenerating(false);
    }
  }

  async function handleWhatsApp() {
    const text = buildText();
    if (navigator.share) {
      try {
        if (!cardRef.current) { await navigator.share({ text }); return; }
        setGenerating(true);
        const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2, useCORS: true });
        const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
        const file = new File([blob], `egypt-update.png`, { type: 'image/png' });
        setGenerating(false);
        await navigator.share({ text, files: [file] });
      } catch (e) {
        setGenerating(false);
        if (e.name !== 'AbortError') {
          window.open('https://wa.me/?text=' + encodeURIComponent(text));
        }
      }
    } else {
      window.open('https://wa.me/?text=' + encodeURIComponent(text));
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildText());
  }

  // --- Card styles ---
  const cardStyle = {
    width: '420px',
    background: 'linear-gradient(135deg, #0c0f1a 0%, #1e1b4b 60%, #312e81 100%)',
    borderRadius: '16px',
    padding: '28px 32px',
    color: 'white',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  };
  const glowStyle = {
    position: 'absolute', top: '-40%', right: '-20%', width: '260px', height: '260px',
    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  };
  const headerStyle = {
    display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px',
    fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em',
  };
  const subHeaderStyle = {
    fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '20px', fontWeight: 500,
  };
  const dividerStyle = { height: '1px', background: 'rgba(255,255,255,0.1)', margin: '16px 0' };
  const sectionLabelStyle = {
    fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em',
    color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: '10px',
  };
  const mono = "'JetBrains Mono', monospace";
  const rowStyle = {
    display: 'flex', justifyContent: 'space-between', fontSize: '12px',
    color: 'rgba(255,255,255,0.65)', lineHeight: '1.8', fontFamily: mono,
  };
  const groupStyle = { marginBottom: '14px' };
  const groupNameStyle = { fontSize: '13px', fontWeight: 600, marginBottom: '6px' };
  const totalBoxStyle = {
    background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 16px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px',
  };
  const totalLabelStyle = {
    fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em',
    fontWeight: 600, color: 'rgba(255,255,255,0.5)',
  };
  const totalValueStyle = { fontFamily: mono, fontSize: '18px', fontWeight: 700 };
  const footerStyle = { fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '14px', textAlign: 'right' };
  const dotStyle = (color) => ({
    width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0,
  });

  // === STEP 1: Payment Selection ===
  if (step === 1) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
          <h3 className="modal-title">Select Payments to Share</h3>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1rem' }}>
            Choose which payments to include in the update for Ali.
          </p>

          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
            {months.map(month => {
              const monthPayments = monthMap.get(month);
              const allChecked = monthPayments.every(p => selected.has(p.id));
              const someChecked = monthPayments.some(p => selected.has(p.id));
              return (
                <div key={month} style={{ marginBottom: '1rem' }}>
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem',
                      cursor: 'pointer', userSelect: 'none',
                    }}
                    onClick={() => toggleMonth(monthPayments)}
                  >
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                      onChange={() => toggleMonth(monthPayments)}
                      style={{ accentColor: '#6366f1', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#334155' }}>
                      {fmtDate(month)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      ({monthPayments.length} payment{monthPayments.length > 1 ? 's' : ''})
                    </span>
                  </div>
                  {monthPayments.map(p => (
                    <label
                      key={p.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.625rem',
                        padding: '0.5rem 0.75rem', marginLeft: '0.25rem',
                        borderRadius: '8px', cursor: 'pointer',
                        background: selected.has(p.id) ? '#eef2ff' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => togglePayment(p.id)}
                        style={{ accentColor: '#6366f1', width: '15px', height: '15px', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <span style={{
                        display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                        background: p.project_color, flexShrink: 0,
                      }} />
                      <span style={{ fontWeight: 500, fontSize: '0.875rem', flex: 1 }}>{p.project_name}</span>
                      <span style={{ fontFamily: mono, fontSize: '0.8125rem', color: '#334155', whiteSpace: 'nowrap' }}>
                        {fmt(p.egp_amount)} EGP
                      </span>
                      <span style={{ fontFamily: mono, fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {p.sar_transferred ? `${fmt(p.sar_transferred)} SAR` : '—'}
                      </span>
                    </label>
                  ))}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
              {selected.size} payment{selected.size !== 1 ? 's' : ''} selected
            </span>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" disabled={selected.size === 0} onClick={() => setStep(2)}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compute latest date from selected for the subheader
  const latestDate = selectedPayments.length > 0
    ? selectedPayments.reduce((latest, p) => p.date > latest ? p.date : latest, selectedPayments[0].date)
    : '';

  // === STEP 2: Preview & Share ===
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px', background: '#f1f5f9', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 className="modal-title" style={{ margin: 0 }}>Preview &amp; Share</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setStep(1)}>&larr; Back</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', overflowX: 'auto' }}>
          <div ref={cardRef} style={cardStyle}>
            <div style={glowStyle} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={headerStyle}>
                <span>🏠</span> Egypt Investments Update
              </div>
              <div style={subHeaderStyle}>
                {selectedPayments.length === 1 ? 'Payment' : `${selectedPayments.length} Payments`} — {fmtDate(latestDate)}
              </div>

              <div style={sectionLabelStyle}>
                {selectedPayments.length === 1 ? 'Payment' : 'Payments'}
              </div>
              {selectedPayments.map(p => (
                <div key={p.id} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                      <span style={dotStyle(p.project_color)}>​</span>
                      <span>✅ {p.project_name}</span>
                    </div>
                    <div style={{ fontFamily: mono, fontSize: '14px', fontWeight: 600 }}>{fmt(p.egp_amount)} EGP</div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: mono, paddingLeft: '16px' }}>
                    {p.sar_transferred ? `${fmt(p.sar_transferred)} SAR @ ${rate(p.egp_amount, p.sar_transferred)}` : '—'}
                  </div>
                </div>
              ))}

              <div style={dividerStyle} />

              <div style={sectionLabelStyle}>Settlement (SAR)</div>

              <div style={groupStyle}>
                <div style={groupNameStyle}>Boutique Village</div>
                <div style={rowStyle}><span>Fahad paid</span><span>{fmt(summary.bv_total_sar)}</span></div>
                <div style={rowStyle}><span>50%</span><span>{fmt(bv50)}</span></div>
                <div style={rowStyle}><span>Ali paid</span><span>{fmt(summary.bv_ali_transferred)}</span></div>
                <div style={{ ...rowStyle, color: bvRemaining > 0 ? '#fbbf24' : '#34d399', fontWeight: 600 }}>
                  <span>Remaining</span><span>{fmt(bvRemaining)}</span>
                </div>
              </div>

              <div style={groupStyle}>
                <div style={groupNameStyle}>Mountain View</div>
                <div style={rowStyle}><span>Fahad paid</span><span>{fmt(summary.mv_total_sar)}</span></div>
                <div style={rowStyle}><span>50%</span><span>{fmt(mv50)}</span></div>
                <div style={rowStyle}><span>Ali paid</span><span>{fmt(summary.mv_ali_transferred)}</span></div>
                <div style={{ ...rowStyle, color: mvRemaining > 0 ? '#fbbf24' : '#34d399', fontWeight: 600 }}>
                  <span>Remaining</span><span>{fmt(mvRemaining)}</span>
                </div>
              </div>

              <div style={totalBoxStyle}>
                <div style={totalLabelStyle}>Total Remaining</div>
                <div style={totalValueStyle}>{fmt(summary.ali_remaining)} SAR</div>
              </div>

              <div style={footerStyle}>As of {today()}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleWhatsApp} disabled={generating} style={{ gap: '0.5rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            {generating ? 'Preparing...' : 'WhatsApp'}
          </button>
          <button className="btn btn-secondary" onClick={handleDownload} disabled={generating}>
            {generating ? 'Generating...' : 'Download Image'}
          </button>
          <button className="btn btn-secondary" onClick={handleCopy}>
            Copy Text
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
