export function FullScreenLoading({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="center-screen" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p className="muted">{label}</p>
    </div>
  );
}

export function InlineLoading({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="row muted" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" style={{ width: 18, height: 18 }} />
      <span className="small">{label}</span>
    </div>
  );
}
