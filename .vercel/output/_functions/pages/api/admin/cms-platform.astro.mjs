import { z } from 'zod';
import { r as requireRole } from '../../../chunks/auth_DISlxqQV.mjs';
import { d as db } from '../../../chunks/db_DpmQIvvC.mjs';
import { g as getCmsRuntimeConfig, c as clearCmsRuntimeCache } from '../../../chunks/cms-platform_BFp56eeM.mjs';
import { l as listPagesFromPayload } from '../../../chunks/payload-cms_DGSW8rk7.mjs';
export { renderers } from '../../../renderers.mjs';

const updateSchema = z.object({
  cmsPlatform: z.enum(["custom", "payload"]),
  payloadReadMode: z.enum(["preview-only", "all"])
});
const GET = async (context) => {
  const user = await requireRole(context, ["ADMIN", "EDITOR"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const runtime = await getCmsRuntimeConfig({ forceRefresh: true });
  const payloadPages = runtime.cmsPlatform === "payload" ? await listPagesFromPayload().catch(() => []) : [];
  const payloadBaseUrl = (process.env.PAYLOAD_CMS_URL || "http://127.0.0.1:4000").replace(/\/+$/, "");
  const payloadAdminUrl = `${payloadBaseUrl}/admin`;
  const payloadApiUrl = `${payloadBaseUrl}/api/pages?limit=1`;
  let apiReachable = false;
  try {
    const res = await fetch(payloadApiUrl, { method: "GET", cache: "no-store" });
    apiReachable = res.ok;
  } catch {
    apiReachable = false;
  }
  return new Response(JSON.stringify({
    ok: true,
    runtime,
    payload: {
      baseUrl: payloadBaseUrl,
      adminUrl: payloadAdminUrl,
      apiUrl: payloadApiUrl,
      apiReachable
    },
    payloadProbe: {
      reachable: payloadPages.length > 0,
      pageCount: payloadPages.length
    }
  }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};
const PUT = async (context) => {
  const user = await requireRole(context, ["ADMIN"]);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  const parsed = updateSchema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ ok: false, error: "Invalid payload" }), { status: 400 });
  await db.siteSetting.upsert({
    where: { key: "cms.platform" },
    update: { value: parsed.data.cmsPlatform },
    create: { key: "cms.platform", value: parsed.data.cmsPlatform }
  });
  await db.siteSetting.upsert({
    where: { key: "cms.payloadReadMode" },
    update: { value: parsed.data.payloadReadMode },
    create: { key: "cms.payloadReadMode", value: parsed.data.payloadReadMode }
  });
  clearCmsRuntimeCache();
  const runtime = await getCmsRuntimeConfig({ forceRefresh: true });
  return new Response(JSON.stringify({ ok: true, runtime }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  PUT
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
