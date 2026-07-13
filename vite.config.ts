import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Same bundle works under file:// (native wrap), custom domain, and GitHub Pages.
// On CI we publish under /gaoqian/, everywhere else relative.
export default defineConfig({
  base: process.env.CI ? '/gaoqian/' : './',
  plugins: [react()],
  server: { port: 5200, host: true },
  preview: { port: 4202 },
})
