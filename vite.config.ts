/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'; // ORVULIX-SECURITY: typed Vite/Vitest 4 config.
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import packageJson from './package.json';
import { execSync } from 'node:child_process';

const commitHash = execSync('git rev-parse --short HEAD').toString().trim();

// https://vitejs.dev/config https://vitest.dev/config
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  define: {
    'process.env': {},
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __COMMIT_HASH__: JSON.stringify(commitHash)
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  },
  test: {
    globals: true,
    environment: 'happy-dom', // ORVULIX-SECURITY: patched; sanitizer fidelity tests use jsdom.
    // ORVULIX-SECURITY: unit emulators do not execute input scripts or load resources; native browser tests cover real frame behavior.
    environmentOptions: {
      jsdom: { runScripts: 'outside-only' },
      happyDOM: {
        settings: {
          enableJavaScriptEvaluation: false,
          disableJavaScriptFileLoading: true,
          disableCSSFileLoading: true,
          disableIframePageLoading: true,
          enableImageFileLoading: false
        }
      }
    },
    setupFiles: '.vitest/setup',
    include: ['**/*.test.{ts,tsx}']
  },
  worker: { format: 'es' }
});
