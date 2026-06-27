// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

import tailwindcss from '@tailwindcss/vite';

// Production URL. Override at build time with:
//   SITE_URL=https://commands-agent.netlify.app bun build
const site =
  process.env.SITE_URL ?? 'https://commands-agent.netlify.app';

// https://astro.build/config
export default defineConfig({
  site,
  output: 'static',
  adapter: netlify(),
  vite: {
    plugins: [tailwindcss()]
  }
});
