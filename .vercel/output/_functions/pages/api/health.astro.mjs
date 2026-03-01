import { g as getCmsRuntimeConfig } from '../../chunks/cms-platform_HsZsHVYA.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async () => {
  const runtime = await getCmsRuntimeConfig();
  return new Response(JSON.stringify({
    ok: true,
    service: "bowlingroom-cms",
    cmsPlatform: runtime.cmsPlatform,
    cmsPayloadReadMode: runtime.payloadReadMode,
    cmsConfigSource: runtime.source
  }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
