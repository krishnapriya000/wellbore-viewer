export function NotFoundPage() {
  return (
    <main className="layout single" style={{ padding: '24px' }}>
      <div className="block" style={{ padding: '36px', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 8px 0' }}>Page Not Found</h2>
        <p className="hint">The requested route does not exist.</p>
        <a href="/" className="btn small primary" style={{ marginTop: '12px', display: 'inline-block' }}>
          Return to Incident Center
        </a>
      </div>
    </main>
  );
}

