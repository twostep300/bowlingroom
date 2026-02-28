# CMS Platform Evaluation (2026-02-21)

## 1) Repo Audit (Ist-Zustand)

Aktueller Stack:
- Astro + Node Adapter
- Prisma + Postgres
- Custom CMS APIs (`/api/content/*`, `/api/admin/*`)
- Zwei Admin-Engines:
  - `public/admin/cockpit.js` (modulares Cockpit)
  - `public/admin/admin.js` (starker Section/Page Builder mit Drag & Drop + Preview postMessage)

Stärken:
- Datenmodell ist bereits breit (Pages, Locations, Events, Deals, Campaigns, Forms, Leads, Settings).
- Draft/History vorhanden (`ContentRevision` + `/api/history/*`).
- Frontend rendert CI stabil aus Content JSON (kein Layout-Bruch durch diese Analyse).

Schwächen:
- CMS-UX verteilt auf zwei Engines, inkonsistente Bedienung.
- Preview-Flow war instabil (teilweise doppelt, teilweise nicht synchron).
- Content Types sind nicht immer klar an Ausspielung gekoppelt.
- Section-Editing existiert, aber war nicht zentral im neuen Cockpit integriert.

## 2) Optionen (Open Source)

Bewertete Systeme:
- Payload CMS
- Directus
- Strapi (optional als Vergleich)

### Payload CMS
Vorteile:
- Sehr gutes Block/Field-Modell für echten Page Builder.
- Draft + Versioning + Live Preview sehr gut für „Editor + iFrame“-Flows.
- TS-first, gut für stark typisierte Section-Configs.
- Postgres/Mongo Support, Self-hosted.

Nachteile:
- Migration von bestehender Custom-Adminlogik ist ein Projekt.

### Directus
Vorteile:
- Sehr reife Data-App-UX für Redakteure.
- Sehr gut bei relationalen Daten, Rollen/Rechten, Flows.
- Postgres-native.

Nachteile:
- Page-Builder-Feeling mit frei reorderbaren Design-Sections weniger nativ als Payload Blocks.
- Live-Preview/Block-Editing meist stärker customisiert.

### Strapi
Vorteile:
- Etabliert, große Community.
- Komponenten/Dynamic Zones möglich.

Nachteile:
- Für „OnePager-like“ Block-UX + sofortige visuelle Preview in der Praxis oft mehr Eigenbau als bei Payload.

## 3) Entscheidung

**Empfehlung: Payload CMS** als Zielsystem für Mitarbeiter-Usability + Page Builder.

Begründung:
- Bestes Match für dein Anforderungsprofil „Sections/Blocks + Drag&Drop + Draft Preview“.
- Saubere Modellierung der geplanten IA (Settings/Marketing/Forms/Events/Pages) via Collections + Globals.
- TS-first erleichtert sichere Migration ohne CI-Bruch.

## 4) Quellen (offizielle Doku)

- Payload Features: https://payloadcms.com/docs/overview/why-payload
- Payload Draft Preview: https://payloadcms.com/docs/live-preview/overview
- Payload Versions/Drafts: https://payloadcms.com/docs/versions/overview
- Directus Overview: https://docs.directus.io/
- Directus Flows/Automations: https://docs.directus.io/guides/automate/flows.html
- Strapi Docs: https://docs.strapi.io/
