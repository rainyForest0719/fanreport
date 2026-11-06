import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
// Preview uses the same headers as compatible static hosting. Development stays HMR-compatible.
const securityHeaders = Object.fromEntries(
  readFileSync(new URL('./public/_headers', import.meta.url), 'utf8')
    .split(/\r?\n/).filter(line => /^  [A-Za-z-]+:/.test(line))
    .map(line => { const index = line.indexOf(':'); return [line.slice(0, index).trim(), line.slice(index + 1).trim()]; })
);
export default defineConfig(({mode}) => ({ base: loadEnv(mode, process.cwd(), '').VITE_BASE_PATH || '/', plugins: [react()], preview: { headers: securityHeaders } }));
