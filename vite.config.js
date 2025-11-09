gimport { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  base: 'https://YouyouzkT.github.io/zkTDrawOnchain/',   // Important pour que les chemins relatifs fonctionnent sur GitHub Pages
  plugins: [react()],
})
