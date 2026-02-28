import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

const deployTarget = (process.env.DEPLOY_TARGET || 'node').toLowerCase();
const adapter = deployTarget === 'vercel'
  ? vercel()
  : node({ mode: 'standalone' });

export default defineConfig({
  output: 'server',
  adapter,
  site: process.env.PUBLIC_SITE_URL || 'https://www.bowlingroom.com',
  security: {
    checkOrigin: true
  }
});
