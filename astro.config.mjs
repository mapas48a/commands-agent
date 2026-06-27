// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

import tailwindcss from '@tailwindcss/vite';

// Production URL. Override at build time with:
//   SITE_URL=https://commands.agent.dev bun build
const site =
  process.env.SITE_URL ?? 'http://localhost:4321';

// https://astro.build/config
export default defineConfig({
  site,
  output: 'static',
  adapter: netlify(),
  vite: {
    plugins: [tailwindcss()]
  }
});
