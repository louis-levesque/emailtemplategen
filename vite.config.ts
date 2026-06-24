import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// VITE_BASE_PATH defaults to '/emailtemplategen/' for GitHub Pages.
// Set VITE_BASE_PATH=/ when building for Dokploy or any root-path deployment.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE_PATH ?? '/emailtemplategen/',
})
