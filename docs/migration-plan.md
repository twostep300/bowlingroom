# Migrations-Plan

## Phase 1 – Foundation
1. Astro-Projektstruktur im bestehenden Repo anlegen
2. Prisma + Postgres Schema modellieren
3. Docker Compose für lokale DB bereitstellen
4. Basis-Auth (Admin/Editor) + Session-Modell
5. Security-Middleware (Headers, Origin-Schutz für write APIs)

## Phase 2 – Core CMS APIs
1. Events API (weekly/special/highlights)
2. Forms API inkl. Submission-Pipeline
3. Deals/Campaign APIs
4. Leads API + CSV Export

## Phase 3 – Integrationen
1. Zendesk Adapter (Webhook/Inbound-konfigurierbar)
2. Prevo Adapter mit Retry
3. Tracking Endpoint + Consent-respektierende Erfassung

## Phase 4 – SEO & Operations
1. Sitemap/Robots/Cannonical/JSON-LD Pipeline
2. Redirect-Management über DB
3. Deployment-Runbooks (Vercel/Neon + Fly/Render)

## Phase 5 – UI Integration (ohne Designänderung)
1. Bestehende UI an neue APIs anbinden
2. Admin-Flows rollenbasiert absichern
3. Smoke-Tests für Login + Formular
