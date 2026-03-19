export default function StatusPill({ status }) {
  const cls = {
    PAID: 'pill-paid',
    DUE: 'pill-due',
    UPCOMING: 'pill-upcoming',
    OVERDUE: 'pill-overdue',
  }[status] || 'pill-upcoming';

  return <span className={`pill ${cls}`}>{status}</span>;
}
