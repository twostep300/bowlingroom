import { RootPage } from '@payloadcms/next/views';
import { importMap } from '../importMap';

type PageArgs = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<Record<string, string | string[]>>;
};

export default async function PayloadAdminPage(args: PageArgs) {
  try {
    const configPromise = import('../../../../payload.config.js').then((mod) => mod.default);
    return await RootPage({ ...args, config: configPromise, importMap });
  } catch (error) {
    const err = error as Error & { digest?: string };
    if (
      err?.message === 'NEXT_REDIRECT' ||
      String(err?.digest || '').startsWith('NEXT_REDIRECT')
    ) {
      throw error;
    }
    return (
      <main style={{ padding: 24, color: '#f3f4f6', background: '#0b0d12', minHeight: '100vh', fontFamily: 'ui-sans-serif,system-ui' }}>
        <h1 style={{ marginTop: 0 }}>Payload Admin Fehler</h1>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#111827', border: '1px solid #374151', borderRadius: 8, padding: 12 }}>
{`message: ${err?.message || 'unknown'}
digest: ${err?.digest || 'n/a'}
stack:
${err?.stack || 'n/a'}`}
        </pre>
      </main>
    );
  }
}
