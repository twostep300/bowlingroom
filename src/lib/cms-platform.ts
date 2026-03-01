import { db } from '@/lib/db';

export type CmsPlatform = 'custom' | 'payload';
export type PayloadReadMode = 'preview-only' | 'all';
export type CmsRuntimeConfig = {
  cmsPlatform: CmsPlatform;
  payloadReadMode: PayloadReadMode;
  source: 'env' | 'db';
};

type CacheState = { value: CmsRuntimeConfig; expiresAt: number };
let cache: CacheState | null = null;

export function getCmsPlatform(): CmsPlatform {
  const raw = (process.env.CMS_PLATFORM || 'custom').toLowerCase();
  return raw === 'payload' ? 'payload' : 'custom';
}

export function isPayloadPlatform(): boolean {
  return getCmsPlatform() === 'payload';
}

export function getPayloadReadMode(): PayloadReadMode {
  const raw = (process.env.CMS_PAYLOAD_READ_MODE || 'preview-only').toLowerCase();
  return raw === 'all' ? 'all' : 'preview-only';
}

export function readCmsRuntimeFromEnv(): CmsRuntimeConfig {
  return {
    cmsPlatform: getCmsPlatform(),
    payloadReadMode: getPayloadReadMode(),
    source: 'env'
  };
}

export function clearCmsRuntimeCache() {
  cache = null;
}

export async function getCmsRuntimeConfig(options: { forceRefresh?: boolean } = {}): Promise<CmsRuntimeConfig> {
  const now = Date.now();
  if (!options.forceRefresh && cache && cache.expiresAt > now) return cache.value;

  const envConfig = readCmsRuntimeFromEnv();
  if (process.env.VERCEL || process.env.CMS_RUNTIME_SOURCE === 'env-only') {
    cache = { value: envConfig, expiresAt: now + 4000 };
    return envConfig;
  }

  try {
    const rows = await db.siteSetting.findMany({
      where: { key: { in: ['cms.platform', 'cms.payloadReadMode'] } }
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));

    const rawPlatform = String(map.get('cms.platform') ?? '').toLowerCase();
    const rawMode = String(map.get('cms.payloadReadMode') ?? '').toLowerCase();

    const cmsPlatform: CmsPlatform = rawPlatform === 'payload' ? 'payload' : rawPlatform === 'custom' ? 'custom' : envConfig.cmsPlatform;
    const payloadReadMode: PayloadReadMode = rawMode === 'all' ? 'all' : rawMode === 'preview-only' ? 'preview-only' : envConfig.payloadReadMode;

    const out: CmsRuntimeConfig = {
      cmsPlatform,
      payloadReadMode,
      source: rows.length > 0 ? 'db' : 'env'
    };
    cache = { value: out, expiresAt: now + 4000 };
    return out;
  } catch {
    cache = { value: envConfig, expiresAt: now + 4000 };
    return envConfig;
  }
}
