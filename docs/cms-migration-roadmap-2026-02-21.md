# CMS Migration Roadmap (No Downtime)

## Ziel
Custom CMS schrittweise auf Payload migrieren, ohne Frontend-CI zu verändern und ohne Datenverlust.

## Phase 0: Stabilisierung (abgeschlossen/aktiv)
- Neuer Cockpit-Einstieg als Single Entry.
- Page Builder in Cockpit integriert (intern via bestehender Builder-Engine).
- Preview-Doppelung entfernt, Vorschau schaltbar (persistente Einstellung).
- Live-Draft-Preview im Content-Editor verbessert.

## Phase 1: Daten- und API-Kompatibilitätslayer
- Bestehende JSON/DB-Contentmodelle als „Source of Truth“ dokumentieren.
- API-Verträge einfrieren:
  - `/api/content/:page`
  - `/api/pages`
  - `/api/events`, `/api/deals`, `/api/campaigns`
  - `/api/forms/:slug/submit`
- Additive Erweiterungen (kein Breaking Change):
  - Section-Placement-Validierung
  - Content-Type-to-Placement Constraints

## Phase 2: Payload CMS parallel aufsetzen
- Monorepo-Teil `apps/cms` (Payload + Postgres).
- Collections + Globals:
  - Globals: `settings`, `brand`, `header`, `footer`, `integrations`
  - Collections: `pages`, `locations`, `eventsWeekly`, `eventsUpcoming`, `deals`, `campaigns`, `forms`, `leads`, `media`
- Pages als Blocks (`layout`) mit klaren Section-Typen.

## Phase 3: Sync & Migration
- Einmalmigration:
  - `ContentPage.content` -> Payload `pages.layout + fields`
  - Events/Deals/Campaigns/Forms/Leads
- Dual-Write (optional Übergang):
  - Änderungen aus neuem CMS parallel in altes Modell schreiben, bis Web vollständig umgestellt ist.
- Versionierung/Drafts in Payload aktiv.

## Phase 4: Web (Astro) auf Payload Read-Adapter umstellen
- Zuerst Preview-Routen:
  - `/preview?page=<slug>&token=<signed>`
- Danach Read-Pfade:
  - Page Render Data aus Payload statt Custom Storage.
- Output-Snapshot-Vergleich (HTML diff tolerant auf non-visual attrs).

## Phase 5: Ablösung Alt-CMS
- Alte Admin-Routen readonly/frozen.
- Datenkonsistenz prüfen.
- Final switch + Monitoring.

## Qualitäts-Gates pro Phase
- Keine visuellen Änderungen im Frontend.
- E2E Smoke:
  - Admin Login
  - Page öffnen -> Section reorder -> Preview aktualisiert
  - Formularsubmit -> Lead
  - Deal aktivieren -> Slot sichtbar
  - Draft vs Published korrekt

## Rollback-Strategie
- Feature Flag für Datenquelle (`custom|payload`).
- Rückfall auf Custom APIs jederzeit möglich.
- Datenmigrationen nur additiv, nie destructive.
