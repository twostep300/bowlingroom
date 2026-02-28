import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';

import { Pages } from './src/collections/pages.mjs';
import { Users } from './src/collections/users.mjs';
import { Locations } from './src/collections/locations.mjs';
import { EventsWeekly } from './src/collections/events-weekly.mjs';
import { EventsUpcoming } from './src/collections/events-upcoming.mjs';
import { Deals } from './src/collections/deals.mjs';
import { Campaigns } from './src/collections/campaigns.mjs';
import { Forms } from './src/collections/forms.mjs';
import { Leads } from './src/collections/leads.mjs';
import { Media } from './src/collections/media.mjs';

import { GlobalSEO } from './src/globals/global-seo.mjs';
import { GlobalTracking } from './src/globals/global-tracking.mjs';
import { GlobalIntegrations } from './src/globals/global-integrations.mjs';
import { GlobalBrand } from './src/globals/global-brand.mjs';

const cmsRoot = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(cmsRoot, '.env') });
dotenv.config({ path: path.resolve(cmsRoot, '..', '..', '.env'), override: false });

const databaseUrl =
  process.env.PAYLOAD_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@127.0.0.1:5432/bowlingroom?schema=public';

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'replace-me',
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://127.0.0.1:4000',
  db: postgresAdapter({
    pool: { connectionString: databaseUrl },
    push: true
  }),
  admin: {
    user: 'users',
    meta: {
      titleSuffix: ' - Bowlingroom CMS'
    }
  },
  collections: [
    Users,
    Pages,
    Locations,
    EventsWeekly,
    EventsUpcoming,
    Deals,
    Campaigns,
    Forms,
    Leads,
    Media
  ],
  globals: [GlobalSEO, GlobalTracking, GlobalIntegrations, GlobalBrand]
});
