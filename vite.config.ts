import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Repo is served from https://ardliath.github.io/DnDHelper/
  base: '/DnDHelper/',
  plugins: [react()],
})
