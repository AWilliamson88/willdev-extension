import { defineConfig } from 'vite'
import path from "path";
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@emotion/styled'],
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        background: 'public/background.js',
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
  resolve: {
    alias: [
      {
        find: /@mui\/material/,
        replacement: path.resolve(__dirname, 'node_modules', '@mui', 'material'),
      },
    ],
  },
})
