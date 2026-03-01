import { d as db } from './db_DSJcG3jK.mjs';

let cache = null;
function getCmsPlatform() {
  const raw = (process.env.CMS_PLATFORM || "custom").toLowerCase();
  return raw === "payload" ? "payload" : "custom";
}
function getPayloadReadMode() {
  const raw = (process.env.CMS_PAYLOAD_READ_MODE || "preview-only").toLowerCase();
  return raw === "all" ? "all" : "preview-only";
}
function readCmsRuntimeFromEnv() {
  return {
    cmsPlatform: getCmsPlatform(),
    payloadReadMode: getPayloadReadMode(),
    source: "env"
  };
}
function clearCmsRuntimeCache() {
  cache = null;
}
async function getCmsRuntimeConfig(options = {}) {
  const now = Date.now();
  if (!options.forceRefresh && cache && cache.expiresAt > now) return cache.value;
  const envConfig = readCmsRuntimeFromEnv();
  try {
    const rows = await db.siteSetting.findMany({
      where: { key: { in: ["cms.platform", "cms.payloadReadMode"] } }
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const rawPlatform = String(map.get("cms.platform") ?? "").toLowerCase();
    const rawMode = String(map.get("cms.payloadReadMode") ?? "").toLowerCase();
    const cmsPlatform = rawPlatform === "payload" ? "payload" : rawPlatform === "custom" ? "custom" : envConfig.cmsPlatform;
    const payloadReadMode = rawMode === "all" ? "all" : rawMode === "preview-only" ? "preview-only" : envConfig.payloadReadMode;
    const out = {
      cmsPlatform,
      payloadReadMode,
      source: rows.length > 0 ? "db" : "env"
    };
    cache = { value: out, expiresAt: now + 4e3 };
    return out;
  } catch {
    cache = { value: envConfig, expiresAt: now + 4e3 };
    return envConfig;
  }
}

export { clearCmsRuntimeCache as c, getCmsRuntimeConfig as g };
