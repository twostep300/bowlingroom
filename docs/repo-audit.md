# Repo Audit (Bowlingroom)

## Ist-Zustand
- Bestehendes Projekt: statische HTML/JS/CSS-Seiten in `public/`
- Custom CMS: `public/admin/*`
- API/Server: eigener Node HTTP-Server (`server.js`)
- Content-Storage: JSON-Dateien (`content/pages/*.json`)
- Historie: dateibasierte Snapshots (`content/history/*`)
- Keine DB, kein ORM, kein standardisierter Build/Deploy-Stack

## Risiken im bisherigen Zustand
- Dateibasiertes Content-Storage limitiert Skalierung/Concurrency
- Keine relationale Integrität für Events/Forms/Deals/Campaigns
- Kein standardisiertes Auth-Modell (nur Basis-CMS-Mechanik)
- Fehlende CI/CD-Konventionen und fehlende reproduzierbare Deploy-Topologie

## Zielbild
- Astro (Hybrid SSR/SSG) + Astro API Endpoints
- Postgres als Primär-Storage
- Prisma ORM + Migrations
- Rollenbasiertes Admin/Auth
- Professionelle Content- und Marketing-Module (Events/Forms/Deals/Campaigns)

## UI-Constraint
- Kein visuelles Redesign
- Bestehende CI/Layout-Entscheidungen bleiben erhalten
- Architektur- und Datenebene wird professionalisiert
