# Bowlingroom Payload CMS (`apps/cms`)

Parallel aufgesetztes Ziel-CMS (Payload), ohne Umschalten des Live-Frontends.

## Start
1. `cp apps/cms/.env.example apps/cms/.env`
2. In `apps/cms/.env` `DATABASE_URL` und `PAYLOAD_SECRET` setzen
3. Dependencies installieren:
   - `npm install --prefix apps/cms`
4. Dev starten:
   - `npm run dev --prefix apps/cms`
5. Admin öffnen:
   - `http://127.0.0.1:4000/admin`
6. Beim ersten Start in Payload den ersten Admin-User anlegen.
   Hinweis: Das Schema wird über den Postgres Adapter automatisch gepusht (`push: true`).

## Wichtige Collections
- `pages` (mit `layout` Blocks + `legacyContent` Übergangsfeld)
- `locations`
- `events-weekly`
- `events-upcoming`
- `deals`
- `campaigns`
- `forms`
- `leads`
- `media`

## Globals
- `settings-seo`
- `settings-tracking`
- `settings-integrations`
- `settings-brand`

## Hinweis zur Migration
Der aktuelle Web-Stack bleibt default auf `CMS_PLATFORM=custom`.
Die Umschaltung erfolgt schrittweise über Feature-Flag nach Datenimport und Preview-Abnahme.

## Vergleich Custom vs Payload
- Im Bowlingroom Cockpit unter `Einstellungen -> CMS Plattform`:
  - `Payload Admin öffnen`
  - Plattform-Switch (`custom` / `payload`)
  - Read-Mode (`preview-only` / `all`)

## Technischer Hinweis
- `apps/cms` läuft als Next.js-App mit Payload Admin UI.
- API-Route: `app/(payload)/api/[...slug]/route.ts`
- Admin-Route: `app/(payload)/admin/[[...segments]]/page.tsx`
