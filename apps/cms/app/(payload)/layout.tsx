import '@payloadcms/next/css';

import type { ReactNode } from 'react';
import { RootLayout } from '@payloadcms/next/layouts';
import { importMap } from './admin/importMap';
import { payloadServerFunction } from './server-functions';

export default async function PayloadLayout({ children }: { children: ReactNode }) {
  try {
    const configPromise = import('../../payload.config.js').then((mod) => mod.default);
    return await RootLayout({
      children,
      config: configPromise,
      importMap,
      serverFunction: payloadServerFunction
    });
  } catch (error) {
    const err = error as Error & { digest?: string };
    if (
      err?.message === 'NEXT_REDIRECT' ||
      String(err?.digest || '').startsWith('NEXT_REDIRECT')
    ) {
      throw error;
    }
    return (
      <html lang="de">
        <body style={{ padding: 24, color: '#f3f4f6', background: '#0b0d12', fontFamily: 'ui-sans-serif,system-ui' }}>
          <h1 style={{ marginTop: 0 }}>Payload Layout Fehler</h1>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#111827', border: '1px solid #374151', borderRadius: 8, padding: 12 }}>
{`message: ${err?.message || 'unknown'}
digest: ${err?.digest || 'n/a'}
stack:
${err?.stack || 'n/a'}`}
          </pre>
        </body>
      </html>
    );
  }
}
