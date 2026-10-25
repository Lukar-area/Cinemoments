import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'auto-resolve-jsx',
      resolveId(source, importer) {
        if (source.endsWith('.js') && importer) {
          const basePath = path.resolve(path.dirname(importer), source.slice(0, -3));
          const jsxPath = basePath + '.jsx';
          if (fs.existsSync(jsxPath)) {
            return jsxPath;
          }
        }
        return null;
      },
    },
  ],
  resolve: {
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
