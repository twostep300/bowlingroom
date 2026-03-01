import { g as getAuthUser } from '../../../chunks/auth_Cf9RIyTi.mjs';
export { renderers } from '../../../renderers.mjs';

const GET = async (context) => {
  const user = await getAuthUser(context);
  if (!user) return new Response(JSON.stringify({ ok: false }), { status: 401 });
  return new Response(JSON.stringify({ ok: true, user }), {
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
