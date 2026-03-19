export default function ProgressBar({ pct, color }) {
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color || '#6366f1' }} />
    </div>
  );
}
