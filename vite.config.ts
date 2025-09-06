import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/generate-token": {
        target: "http://129.153.161.57:3002",
        changeOrigin: true,
      },
      "/text": {
        target: "http://129.153.161.57:3002",
        changeOrigin: true,
      },
      "/upload": {
        target: "http://129.153.161.57:3002",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://129.153.161.57:3002",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
