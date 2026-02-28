# Architekturentscheidungen

## Warum Prisma (statt Drizzle)
- Schnellere Iteration bei großem relationalen Domain-Modell
- Reifer Migrations-Flow (`migrate dev/deploy`)
- Gute DX mit Prisma Client in Astro API Routes
- Geeignet für klare Admin/Content-Workflows mit vielen Beziehungen

## Warum Astro Hybrid
- SSR für dynamische Inhalte (Events/Deals/Campaigns)
- SSG für statische Seiten und maximale Performance
- Sehr wenig Client-JS durch Islands-Ansatz

## Warum Adapter-Layer für Integrationen
- Zendesk/Prevo als austauschbare Services
- Fehler-/Retry-Logik zentral statt in API-Endpunkten verteilt
- Bessere Testbarkeit und langfristige Wartbarkeit
