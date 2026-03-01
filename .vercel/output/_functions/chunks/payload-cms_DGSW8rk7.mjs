import { createHmac, timingSafeEqual } from 'node:crypto';

function payloadBaseUrl() {
  return (process.env.PAYLOAD_CMS_URL || "http://127.0.0.1:4000").replace(/\/+$/, "");
}
function payloadApiToken() {
  return process.env.PAYLOAD_API_TOKEN || "";
}
function previewSecret() {
  return process.env.PAYLOAD_PREVIEW_SECRET || process.env.CSRF_SECRET || "preview-secret";
}
function authHeaders() {
  const token = payloadApiToken();
  if (!token) return {};
  return { authorization: `Bearer ${token}` };
}
function buildUrl(path, query) {
  const url = new URL(`${payloadBaseUrl()}${path}`);
  if (query) {
    Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return url.toString();
}
function createPreviewToken(page, ttlSeconds = 900) {
  const exp = Math.floor(Date.now() / 1e3) + ttlSeconds;
  const payload = `${page}:${exp}`;
  const sig = createHmac("sha256", previewSecret()).update(payload).digest("hex");
  return `${exp}.${sig}`;
}
function verifyPreviewToken(page, token) {
  const [expRaw, sig] = String(token || "").split(".");
  const exp = Number(expRaw);
  if (!exp || !sig) return false;
  if (Math.floor(Date.now() / 1e3) > exp) return false;
  const payload = `${page}:${exp}`;
  const expected = createHmac("sha256", previewSecret()).update(payload).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}
function extractDocs(json) {
  if (!json || typeof json !== "object") return [];
  const docs = json.docs;
  return Array.isArray(docs) ? docs : [];
}
function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}
function deepMerge(target, patch) {
  Object.entries(patch).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      target[key] = value.slice();
      return;
    }
    if (isObject(value)) {
      const base = isObject(target[key]) ? target[key] : {};
      target[key] = deepMerge({ ...base }, value);
      return;
    }
    target[key] = value;
  });
  return target;
}
function applyLegacySectionOverrides(content, section) {
  const source = String(section.source || "").toLowerCase();
  const titleOverride = typeof section.titleOverride === "string" ? section.titleOverride.trim() : "";
  const textOverride = typeof section.textOverride === "string" ? section.textOverride.trim() : "";
  const imageOverride = typeof section.imageOverride === "string" ? section.imageOverride.trim() : "";
  const ctaLabelOverride = typeof section.ctaLabelOverride === "string" ? section.ctaLabelOverride.trim() : "";
  const ctaHrefOverride = typeof section.ctaHrefOverride === "string" ? section.ctaHrefOverride.trim() : "";
  const setTitleText = (key, textKey = "text") => {
    const obj = isObject(content[key]) ? content[key] : {};
    if (titleOverride) obj.title = titleOverride;
    if (textOverride) obj[textKey] = textOverride;
    content[key] = obj;
  };
  switch (source) {
    case "about":
      setTitleText("about");
      break;
    case "pricing": {
      const obj = isObject(content.pricing) ? content.pricing : {};
      if (titleOverride) obj.title = titleOverride;
      if (textOverride) obj.note = textOverride;
      content.pricing = obj;
      break;
    }
    case "groups": {
      const obj = isObject(content.groups) ? content.groups : {};
      if (titleOverride) obj.title = titleOverride;
      if (textOverride) obj.text = textOverride;
      if (imageOverride) obj.image = imageOverride;
      if (ctaLabelOverride || ctaHrefOverride) {
        const cta = isObject(obj.cta) ? obj.cta : {};
        if (ctaLabelOverride) cta.label = ctaLabelOverride;
        if (ctaHrefOverride) cta.href = ctaHrefOverride;
        obj.cta = cta;
      }
      content.groups = obj;
      break;
    }
    case "location": {
      const obj = isObject(content.location) ? content.location : {};
      if (titleOverride) obj.title = titleOverride;
      if (textOverride) obj.info = textOverride;
      if (imageOverride) obj.mapImage = imageOverride;
      if (ctaHrefOverride) obj.mapLink = ctaHrefOverride;
      content.location = obj;
      break;
    }
    case "events":
      setTitleText("events");
      break;
    case "instagram": {
      const obj = isObject(content.instagram) ? content.instagram : {};
      if (titleOverride) obj.title = titleOverride;
      if (textOverride) obj.handle = textOverride;
      if (ctaHrefOverride) obj.profile = ctaHrefOverride;
      content.instagram = obj;
      break;
    }
    case "slider": {
      const obj = isObject(content.heroSlider) ? content.heroSlider : {};
      if (titleOverride) obj.heading = titleOverride;
      if (textOverride) obj.kicker = textOverride;
      content.heroSlider = obj;
      break;
    }
  }
}
function normalizePayloadLegacyContent(doc) {
  const legacyContent = doc.legacyContent;
  if (!isObject(legacyContent)) {
    const fallback = doc.content;
    return isObject(fallback) ? fallback : null;
  }
  const content = deepClone(legacyContent);
  const layout = Array.isArray(doc.layout) ? doc.layout : [];
  const sectionBlocks = layout.filter((block) => String(block?.blockType || "") === "legacySection");
  if (sectionBlocks.length > 0) {
    const sections = sectionBlocks.map((section, index) => ({
      id: String(section.sectionId || section.source || `section-${index + 1}`),
      source: String(section.source || "about"),
      visible: !(section.visible === false || section.visible === "false")
    }));
    const layoutObj = isObject(content.layout) ? content.layout : {};
    layoutObj.sections = sections;
    layoutObj.sectionOrder = sections.map((s) => s.source);
    content.layout = layoutObj;
    sectionBlocks.forEach((section) => {
      applyLegacySectionOverrides(content, section);
      if (isObject(section.jsonPatch)) {
        deepMerge(content, section.jsonPatch);
      }
    });
  }
  return content;
}
async function listPagesFromPayload() {
  const res = await fetch(buildUrl("/api/pages", { limit: "200", depth: "0" }), {
    headers: authHeaders(),
    cache: "no-store"
  });
  if (!res.ok) return [];
  const json = await res.json().catch(() => ({}));
  const docs = extractDocs(json);
  return docs.map((d) => typeof d.slug === "string" ? d.slug : "").filter(Boolean).sort((a, b) => a.localeCompare(b));
}
async function readPageContentFromPayload(slug, options = {}) {
  const query = {
    limit: "1",
    depth: "4",
    "where[slug][equals]": slug
  };
  if (options.draft) query.draft = "true";
  const res = await fetch(buildUrl("/api/pages", query), {
    headers: authHeaders(),
    cache: "no-store"
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => ({}));
  const [doc] = extractDocs(json);
  if (!doc) return null;
  return normalizePayloadLegacyContent(doc);
}

export { createPreviewToken as c, listPagesFromPayload as l, readPageContentFromPayload as r, verifyPreviewToken as v };
