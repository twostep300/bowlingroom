# Bowlingroom Professional Architecture Rebuild

Production-ready Astro + Postgres + Prisma Architektur für Bowlingroom (ohne visuelle UI-Änderungen).

## Tech Stack
- Astro (latest, hybrid SSR/SSG)
- Astro API Endpoints (`/api/*`)
- Postgres (Pflicht für Produktion)
- Prisma ORM
- TypeScript
- Zod Validation

## Bestehende UI
Die bestehende UI in `public/` bleibt visuell unverändert. Diese Rebuild-Stufe professionalisiert primär Architektur, Datenmodell, APIs, Security und Deployment.

## Local Setup
1. Dependencies installieren:
```bash
npm install
```
2. Environment vorbereiten:
```bash
cp .env.example .env
```
3. DB starten:
```bash
docker compose up -d
```
4. Prisma Client + Migration:
```bash
npm run db:generate
npm run db:migrate
```
5. Seed ausführen:
```bash
npm run db:seed
```
6. Dev starten:
```bash
npm run dev
```

## Git Workflow (empfohlen)
Damit Änderungen sicher bleiben und du jederzeit auf stabile Stände zurückspringen kannst:
1. `main` nur für stabile Stände verwenden
2. Neue Arbeit immer in einem eigenen Branch starten
3. Vor größeren Änderungen committen
4. Erst nach Prüfung in `main` zurückführen

Typischer Ablauf:
```bash
git checkout -b codex/<feature-name>
git add .
git commit -m "feat: <beschreibung>"
```

Für einen sicheren Zwischenstand vor einer größeren Anpassung:
```bash
git add .
git commit -m "chore: snapshot before <beschreibung>"
```

## Wichtige Scripts
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run cms:dev`
- `npm run cms:import`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:deploy`
- `npm run db:seed`
- `npm run db:import:legacy`
- `npm run test:smoke`

## .env
Siehe `.env.example`.
- `CMS_STORAGE_MODE`:
  - `db`: nur Postgres (empfohlen nach Migration)
  - `file`: nur JSON-Dateien (Legacy)
  - `hybrid`: Postgres + JSON-Dual-Write/Fallback (sicherer Übergang)
- `CMS_PLATFORM`:
  - `custom`: aktuelles Custom CMS Backend (Default)
  - `payload`: geplanter Zielmodus für neue CMS-Plattform (stufenweise Migration)
- `CMS_PAYLOAD_READ_MODE` (nur relevant bei `CMS_PLATFORM=payload`):
  - `preview-only`: nur Draft-Preview liest aus Payload, Published bleibt auf Custom
  - `all`: Published + Preview lesen aus Payload
- Payload Integration:
  - `PAYLOAD_CMS_URL`: URL des Payload Backends (z.B. `http://127.0.0.1:4000`)
  - `PAYLOAD_API_TOKEN`: Server-seitiges API Token für Read/Import
  - `PAYLOAD_PREVIEW_SECRET`: Signatur-Secret für Draft-Preview Token

## Auth
- Rollen: `ADMIN`, `EDITOR`
- Endpoints:
  - `POST /api/admin/login`
  - `POST /api/admin/logout`
  - `GET /api/admin/me`

## Hosting-Anforderungen
- 1x Node Runtime (Astro Node Adapter)
- 1x Managed Postgres Datenbank
- Umgebungsvariablen aus `.env.example`
- Optional: Objektspeicher/CDN für Medien

## Core APIs
- `GET /api/events?location=...`
- `POST /api/forms/:slug/submit`
- `GET /api/admin/leads?format=json|csv`
- `GET /api/deals?location=...`
- `GET /api/campaigns?location=...`
- `POST /api/tracking`
- `GET|POST /api/consent`
- `GET /sitemap.xml`

## Legacy CMS-Kompatibilität (Phase 2)
Damit das bestehende visuelle Builder-Frontend in `public/admin` unverändert weiterläuft, sind die bisherigen Endpoints kompatibel nachgezogen:
- `GET /api/pages`
- `GET|PUT /api/content`
- `GET|PUT /api/content/:page`
- `GET /api/history/:page`
- `POST /api/history/:page/snapshot`
- `GET /api/history/:page/diff?from=...&to=...`
- `POST /api/history/:page/restore`

Diese Endpoints lesen/schreiben weiterhin die bestehenden JSON-Dateien unter `content/pages/*` inklusive Historie unter `content/history/*`.

## Legacy JSON -> Postgres Import
Bestehende JSON-Inhalte können in das neue Postgres-Schema importiert werden:
```bash
npm run db:import:legacy
```
Importiert:
- Content Pages
- Locations (außer `brand`)
- Wochenevents und Sonderevents inkl. Location-Zuordnung

## Deployment

### Option A: Vercel + Neon/Supabase
1. GitHub-Repo anlegen und diesen Code pushen
2. Projekt in Vercel importieren (GitHub Integration)
3. Managed Postgres (Neon/Supabase) anlegen
4. In Vercel Environment Variables setzen:
   - `DATABASE_URL`
   - `PUBLIC_SITE_URL` (deine Vercel-Domain)
   - `DEPLOY_TARGET=vercel`
   - alle Security- und Integrations-Variablen aus `.env.example`
5. Build command: `npm run build`
6. `vercel.json` ist bereits vorbereitet
7. Nach erstem Deploy Migration:
```bash
npm run db:deploy
```
8. Optional Seed auf neuer DB:
```bash
npm run db:seed
```

## GitHub Erstverknüpfung
Wenn noch kein Remote existiert:
```bash
git init
git add .
git commit -m "chore: initial project baseline"
git remote add origin <DEIN_GITHUB_REPO_URL>
git push -u origin main
```

### Option B: Fly.io oder Render + Managed Postgres
1. Managed Postgres bereitstellen
2. App als Node Service deployen
3. Env vars setzen (`DATABASE_URL`, Security/Integration vars)
4. Release command: `npm run db:deploy`
5. Healthcheck: `/api/health`

## Security
- Security Headers via Astro Middleware
- Write-API Origin-Schutz
- Form Honeypot + Rate Limit
- Server-seitige Zod-Validierung

## Integrationen
- Zendesk Adapter: `src/lib/integrations/zendesk.ts`
- Prevo Adapter (Retry): `src/lib/integrations/prevo.ts`

## Smoke Tests
```bash
SMOKE_BASE_URL=http://localhost:4321 npm run test:smoke
```

## Erweiterungen (Nächste Schritte)
1. Vollständiger Admin CRUD für alle Module (Pages/Events/Forms/Deals/Campaigns)
2. RBAC-Middleware für alle Admin-Endpunkte
3. Consent Banner + GA4/Meta Injection nur nach Consent
4. Redirect-Manager UI + DB-Anbindung
5. Event-Detailseiten + strukturierte Daten je Event

## CMS Entscheidung & Roadmap
- Bewertung: `docs/cms-platform-evaluation-2026-02-21.md`
- Migrationspfad ohne Downtime: `docs/cms-migration-roadmap-2026-02-21.md`

## Payload (parallel) starten
1. `cp apps/cms/.env.example apps/cms/.env`
2. `npm install --prefix apps/cms`
3. `npm run cms:dev`
4. Optional Datenimport: `npm run cms:import`

## Preview Draft Route
- Endpoint: `/preview?page=<slug>&token=<signed>`
- Token-Erzeugung intern über `POST /api/admin/preview-token`
- Bei `CMS_PLATFORM=payload` liest `/api/content/:page` Draft-Daten aus Payload, wenn gültiger Preview-Cookie gesetzt ist.
