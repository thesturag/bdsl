import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { viteStaticCopy } from 'vite-plugin-static-copy'


// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:9005/',
        changeOrigin: true,
      },
    }
  },
  plugins: [
    react(),
    nodePolyfills(),
    viteStaticCopy({
      targets: [
        {
          src: 'src/pages/models',
          dest: 'src/pages'
        }
      ]
    }),
  ],
  resolve: {
    alias: {
      process: "process/browser",
    },
  },
  define: {
    "process.env": {},
  },
});
