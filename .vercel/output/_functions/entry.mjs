import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CNucklFx.mjs';
import { manifest } from './manifest_BIY2yQou.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/admin.astro.mjs');
const _page2 = () => import('./pages/api/admin/campaigns/_id_.astro.mjs');
const _page3 = () => import('./pages/api/admin/campaigns.astro.mjs');
const _page4 = () => import('./pages/api/admin/cms-platform.astro.mjs');
const _page5 = () => import('./pages/api/admin/csrf.astro.mjs');
const _page6 = () => import('./pages/api/admin/deals/_id_.astro.mjs');
const _page7 = () => import('./pages/api/admin/deals.astro.mjs');
const _page8 = () => import('./pages/api/admin/events/special/_id_.astro.mjs');
const _page9 = () => import('./pages/api/admin/events/special.astro.mjs');
const _page10 = () => import('./pages/api/admin/events/weekly/_id_.astro.mjs');
const _page11 = () => import('./pages/api/admin/events/weekly.astro.mjs');
const _page12 = () => import('./pages/api/admin/forms/_id_/fields/_fieldid_.astro.mjs');
const _page13 = () => import('./pages/api/admin/forms/_id_/fields.astro.mjs');
const _page14 = () => import('./pages/api/admin/forms/_id_.astro.mjs');
const _page15 = () => import('./pages/api/admin/forms.astro.mjs');
const _page16 = () => import('./pages/api/admin/leads.astro.mjs');
const _page17 = () => import('./pages/api/admin/locations/_id_.astro.mjs');
const _page18 = () => import('./pages/api/admin/locations.astro.mjs');
const _page19 = () => import('./pages/api/admin/login.astro.mjs');
const _page20 = () => import('./pages/api/admin/logout.astro.mjs');
const _page21 = () => import('./pages/api/admin/me.astro.mjs');
const _page22 = () => import('./pages/api/admin/pages/_id_.astro.mjs');
const _page23 = () => import('./pages/api/admin/pages.astro.mjs');
const _page24 = () => import('./pages/api/admin/preview-token.astro.mjs');
const _page25 = () => import('./pages/api/admin/redirects/_id_.astro.mjs');
const _page26 = () => import('./pages/api/admin/redirects.astro.mjs');
const _page27 = () => import('./pages/api/admin/settings.astro.mjs');
const _page28 = () => import('./pages/api/campaigns.astro.mjs');
const _page29 = () => import('./pages/api/consent.astro.mjs');
const _page30 = () => import('./pages/api/content/_page_.astro.mjs');
const _page31 = () => import('./pages/api/content.astro.mjs');
const _page32 = () => import('./pages/api/deals.astro.mjs');
const _page33 = () => import('./pages/api/events.astro.mjs');
const _page34 = () => import('./pages/api/forms/_slug_/submit.astro.mjs');
const _page35 = () => import('./pages/api/forms.astro.mjs');
const _page36 = () => import('./pages/api/health.astro.mjs');
const _page37 = () => import('./pages/api/history/_page_/diff.astro.mjs');
const _page38 = () => import('./pages/api/history/_page_/restore.astro.mjs');
const _page39 = () => import('./pages/api/history/_page_/snapshot.astro.mjs');
const _page40 = () => import('./pages/api/history/_page_.astro.mjs');
const _page41 = () => import('./pages/api/pages.astro.mjs');
const _page42 = () => import('./pages/api/settings.astro.mjs');
const _page43 = () => import('./pages/api/track.astro.mjs');
const _page44 = () => import('./pages/api/tracking/config.astro.mjs');
const _page45 = () => import('./pages/api/tracking.astro.mjs');
const _page46 = () => import('./pages/events/_slug_.astro.mjs');
const _page47 = () => import('./pages/preview.astro.mjs');
const _page48 = () => import('./pages/robots.txt.astro.mjs');
const _page49 = () => import('./pages/sitemap.xml.astro.mjs');
const _page50 = () => import('./pages/index.astro.mjs');
const _page51 = () => import('./pages/_---path_.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/admin/index.astro", _page1],
    ["src/pages/api/admin/campaigns/[id].ts", _page2],
    ["src/pages/api/admin/campaigns/index.ts", _page3],
    ["src/pages/api/admin/cms-platform.ts", _page4],
    ["src/pages/api/admin/csrf.ts", _page5],
    ["src/pages/api/admin/deals/[id].ts", _page6],
    ["src/pages/api/admin/deals/index.ts", _page7],
    ["src/pages/api/admin/events/special/[id].ts", _page8],
    ["src/pages/api/admin/events/special/index.ts", _page9],
    ["src/pages/api/admin/events/weekly/[id].ts", _page10],
    ["src/pages/api/admin/events/weekly/index.ts", _page11],
    ["src/pages/api/admin/forms/[id]/fields/[fieldId]/index.ts", _page12],
    ["src/pages/api/admin/forms/[id]/fields/index.ts", _page13],
    ["src/pages/api/admin/forms/[id]/index.ts", _page14],
    ["src/pages/api/admin/forms.ts", _page15],
    ["src/pages/api/admin/leads.ts", _page16],
    ["src/pages/api/admin/locations/[id].ts", _page17],
    ["src/pages/api/admin/locations/index.ts", _page18],
    ["src/pages/api/admin/login.ts", _page19],
    ["src/pages/api/admin/logout.ts", _page20],
    ["src/pages/api/admin/me.ts", _page21],
    ["src/pages/api/admin/pages/[id].ts", _page22],
    ["src/pages/api/admin/pages/index.ts", _page23],
    ["src/pages/api/admin/preview-token.ts", _page24],
    ["src/pages/api/admin/redirects/[id].ts", _page25],
    ["src/pages/api/admin/redirects/index.ts", _page26],
    ["src/pages/api/admin/settings/index.ts", _page27],
    ["src/pages/api/campaigns/index.ts", _page28],
    ["src/pages/api/consent/index.ts", _page29],
    ["src/pages/api/content/[page].ts", _page30],
    ["src/pages/api/content.ts", _page31],
    ["src/pages/api/deals/index.ts", _page32],
    ["src/pages/api/events/index.ts", _page33],
    ["src/pages/api/forms/[slug]/submit.ts", _page34],
    ["src/pages/api/forms/index.ts", _page35],
    ["src/pages/api/health.ts", _page36],
    ["src/pages/api/history/[page]/diff.ts", _page37],
    ["src/pages/api/history/[page]/restore.ts", _page38],
    ["src/pages/api/history/[page]/snapshot.ts", _page39],
    ["src/pages/api/history/[page].ts", _page40],
    ["src/pages/api/pages.ts", _page41],
    ["src/pages/api/settings/index.ts", _page42],
    ["src/pages/api/track/index.ts", _page43],
    ["src/pages/api/tracking/config.ts", _page44],
    ["src/pages/api/tracking/index.ts", _page45],
    ["src/pages/events/[slug].astro", _page46],
    ["src/pages/preview.ts", _page47],
    ["src/pages/robots.txt.ts", _page48],
    ["src/pages/sitemap.xml.ts", _page49],
    ["src/pages/index.astro", _page50],
    ["src/pages/[...path].ts", _page51]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_astro-internal_middleware.mjs')
});
const _args = {
    "middlewareSecret": "0f9ee05b-6a2f-4f65-bc73-ce11f88680a2",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
