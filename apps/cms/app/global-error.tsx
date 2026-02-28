'use client';

import { useEffect } from 'react';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Keep console logging for terminal visibility when available.
    // eslint-disable-next-line no-console
    console.error('Payload admin global error', error);
  }, [error]);

  return (
    <html lang="de">
      <body style={{ background: '#0b0d12', color: '#f3f4f6', fontFamily: 'ui-sans-serif,system-ui', padding: 24 }}>
        <h1 style={{ marginTop: 0 }}>Payload Fehlerdiagnose</h1>
        <p>Bitte diesen Text an den Entwickler senden:</p>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            background: '#111827',
            border: '1px solid #374151',
            borderRadius: 8,
            padding: 12
          }}
        >
{`message: ${error?.message || 'unknown'}
digest: ${error?.digest || 'n/a'}
stack:
${error?.stack || 'n/a'}`}
        </pre>
        <button
          onClick={() => reset()}
          style={{
            marginTop: 12,
            background: '#ff3e00',
            color: '#fff',
            border: '1px solid #ff3e00',
            borderRadius: 8,
            padding: '8px 12px',
            cursor: 'pointer'
          }}
        >
          Erneut versuchen
        </button>
      </body>
    </html>
  );
}
