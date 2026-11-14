import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-ignore plain JS module, dev server only
import { tweaks } from './dev-tweaks-plugin.mjs'

// The page can reach the app through a bridge, so in the shipped build it is also locked down:
// scripts and styles only from the app's own assets, and no outgoing connections of any kind.
// (Not applied in `npm run dev`, where Vite injects inline scripts.)
const csp: Plugin = {
  name: 'sitness-csp',
  apply: 'build',
  transformIndexHtml(html) {
    const policy = [
      "default-src 'none'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",   // Ant Design Mobile sets inline style attributes
      "img-src 'self' data:",
      "font-src 'self' data:",
      "connect-src 'none'",
      "base-uri 'none'",
      "form-action 'none'",
    ].join('; ')
    return html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`)
  },
}

// The bundle is served by the Android app from assets/web/, so everything is built with relative URLs.
export default defineConfig({
  plugins: [react(), csp, tweaks],
  base: './',
  build: {
    outDir: '../app/src/main/assets/web',
    emptyOutDir: true,
    target: 'es2019',          // Android System WebView on API 26 can be old; keep the syntax conservative
    cssTarget: 'chrome61',
    chunkSizeWarningLimit: 900,
  },
})
