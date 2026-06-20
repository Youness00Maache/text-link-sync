import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const page = name => resolve(import.meta.dirname, 'public', name);

export default defineConfig({
  root: resolve(import.meta.dirname, 'public'),
  publicDir: false,
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: page('index.html'),
        receive: page('receive.html'),
        features: page('features.html'),
        howItWorks: page('how-it-works.html'),
        privacy: page('privacy.html')
      }
    }
  }
});
