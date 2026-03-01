import { e as createAstro, f as createComponent, r as renderTemplate, h as addAttribute, ai as renderHead, u as unescapeHTML } from '../../chunks/astro/server_SWj2Xmpp.mjs';
import 'piccolore';
import 'clsx';
import { d as db } from '../../chunks/db_DSJcG3jK.mjs';
export { renderers } from '../../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://www.bowlingroom.com");
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$slug;
  const { slug } = Astro2.params;
  if (!slug) return Astro2.redirect("/");
  const event = await db.specialEvent.findUnique({
    where: { slug },
    include: {
      locations: {
        include: { location: true }
      }
    }
  });
  if (!event || event.status !== "PUBLISHED") {
    return new Response("Not Found", { status: 404 });
  }
  const location = event.locations[0]?.location;
  const pageTitle = event.seoTitle || event.title;
  const pageDescription = event.metaDescription || event.description || "Event bei Bowlingroom";
  const canonical = event.canonicalUrl || new URL(`/events/${event.slug}`, Astro2.site || Astro2.url.origin).toString();
  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description || void 0,
    startDate: event.startDateTime.toISOString(),
    endDate: event.endDateTime?.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: event.ogImage || event.image || void 0,
    location: location ? {
      "@type": "Place",
      name: location.name,
      address: [location.addressLine1, location.postalCode, location.city].filter(Boolean).join(", ")
    } : void 0,
    organizer: {
      "@type": "Organization",
      name: "Bowlingroom"
    }
  };
  return renderTemplate(_a || (_a = __template(['<html lang="de"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>', '</title><meta name="description"', '><link rel="canonical"', ">", '<script type="application/ld+json">', "<\/script>", "</head> <body> <main> <h1>", "</h1> <p>", "</p> <p>Start: ", "</p> ", " ", " </main> </body></html>"])), pageTitle, addAttribute(pageDescription, "content"), addAttribute(canonical, "href"), event.ogImage && renderTemplate`<meta property="og:image"${addAttribute(event.ogImage, "content")}>`, unescapeHTML(JSON.stringify(eventJsonLd)), renderHead(), event.title, event.description, event.startDateTime.toLocaleString("de-DE"), event.endDateTime && renderTemplate`<p>Ende: ${event.endDateTime.toLocaleString("de-DE")}</p>`, event.ctaUrl && renderTemplate`<p> <a${addAttribute(event.ctaUrl, "href")}>${event.ctaLabel || "Jetzt reservieren"}</a> </p>`);
}, "/Users/chris/Documents/New project/src/pages/events/[slug].astro", void 0);

const $$file = "/Users/chris/Documents/New project/src/pages/events/[slug].astro";
const $$url = "/events/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
