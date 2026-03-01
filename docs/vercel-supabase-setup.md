# Vercel + Supabase Setup

Diese Datei ist die einfache Checkliste fuer das Bowlingroom-Projekt.

## 1. Vercel Projekt

- Vercel Projekt: `bowlingroom`
- GitHub Repo: `twostep300/bowlingroom`
- Root Directory: `/`

## 2. Environment Variables in Vercel

Diese Variablen in `Vercel > Project > Settings > Environment Variables` anlegen.

### Pflichtwerte

```env
DEPLOY_TARGET=vercel
NODE_ENV=production
CMS_STORAGE_MODE=hybrid
CMS_PLATFORM=custom
CMS_PAYLOAD_READ_MODE=preview-only
ADMIN_LOCAL_BYPASS=false

ADMIN_SESSION_COOKIE=br_admin_session
ADMIN_CSRF_COOKIE=br_admin_csrf
ADMIN_SESSION_TTL_HOURS=24

ADMIN_DEFAULT_EMAIL=admin@bowlingroom.local
ADMIN_DEFAULT_PASSWORD=HIER_EIN_NEUES_SICHERES_PASSWORT

CSRF_SECRET=HIER_EINE_LANGE_ZUFAELLSZEICHENFOLGE

FORM_RATE_LIMIT_WINDOW_MS=60000
FORM_RATE_LIMIT_MAX=20
LOGIN_RATE_LIMIT_WINDOW_MS=60000
LOGIN_RATE_LIMIT_MAX=10
```

### Datenbank

Passwort nicht hier speichern. In Vercel direkt einsetzen.

```env
DATABASE_URL=postgresql://postgres:DEIN_PASSWORT@db.nkvkupskxrhqckyqmiyr.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:DEIN_PASSWORT@db.nkvkupskxrhqckyqmiyr.supabase.co:5432/postgres
```

Wenn dein Passwort Sonderzeichen wie `@`, `:`, `/`, `?`, `#`, `%` enthaelt, muss es URL-kodiert eingesetzt werden.

### Site URL

```env
PUBLIC_SITE_URL=https://DEINE-VERCEL-DOMAIN.vercel.app
```

## 3. Build Settings

Diese Werte sind bereits im Projekt vorbereitet:

- Build Command: `npm run build`
- Install Command: `npm install`
- Output Directory: `dist`

Datei im Projekt:

- `/Users/chris/Documents/New project/vercel.json`

## 4. Nach dem ersten Deploy

Danach muessen die Prisma-Migrationen gegen die Produktionsdatenbank laufen.

Command:

```bash
npm run db:deploy
```

## 5. Wichtig

- Keine Passwoerter in Git committen
- `ADMIN_LOCAL_BYPASS` in Produktion immer `false`
- Fuer lokale Entwicklung bleibt Bowlingroom auf Port `3000`
- Andere Projekte immer mit eigenem Port und eigenem Vercel-Projekt betreiben
