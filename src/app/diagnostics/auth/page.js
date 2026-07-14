"use client";

import { useEffect, useState } from 'react';

export default function AuthDiagnosticsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      setError('Diagnostics are disabled in production.');
      return;
    }

    fetch('/api/auth/diagnostics')
      .then((res) => res.json())
      .then(setData)
      .catch((err) => setError(err.message || 'Failed to load diagnostics.'));
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return <div style={{ padding: 24 }}>Diagnostics are disabled in production.</div>;
  }

  return (
    <div style={{ padding: 24, color: '#e5e7eb', background: '#0b1020', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Authentication Diagnostics</h1>
      {error && <p style={{ color: '#fca5a5' }}>{error}</p>}
      {!data && !error && <p>Loading diagnostics...</p>}
      {data && (
        <pre style={{ whiteSpace: 'pre-wrap', background: '#111827', padding: 16, borderRadius: 12 }}>
          {JSON.stringify(data.diagnostics, null, 2)}
        </pre>
      )}
    </div>
  );
}
