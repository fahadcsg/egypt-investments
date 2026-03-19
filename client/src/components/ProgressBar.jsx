export default function ProgressBar({ pct, color }) {
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, ${color || '#6366f1'}, ${color || '#6366f1'}dd)` }} />
    </div>
  );
}
