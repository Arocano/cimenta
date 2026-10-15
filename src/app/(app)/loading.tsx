export default function AppLoading() {
  return (
    <div className="screen-enter space-y-4" aria-live="polite" aria-busy="true">
      <p className="sr-only">Abriendo</p>
      <div className="h-9 w-56 rounded-md bg-muted" />
      <div className="h-4 w-72 max-w-full rounded-md bg-muted" />
      <div className="h-48 rounded-lg border border-border bg-card" />
    </div>
  );
}
