export function ConfigErrorPage({ missing }: { missing: string[] }) {
  return (
    <main className="page page--bare">
      <h1>Falta configurar Firebase</h1>
      <p className="muted">
        La app no puede arrancar porque faltan estas variables de entorno. Copia{' '}
        <code>.env.example</code> a <code>.env.local</code> y rellénalas con los datos de tu app web
        de Firebase, o usa <code>VITE_USE_EMULATORS=true</code> para desarrollo local.
      </p>
      <ul className="list" aria-label="Variables faltantes">
        {missing.map((key) => (
          <li key={key} className="list-item">
            <code>{key}</code>
          </li>
        ))}
      </ul>
    </main>
  );
}
