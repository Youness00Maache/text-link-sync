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
        target: "https://api.textlinker.pro",
        changeOrigin: true,
      },
      "/text": {
        target: "https://api.textlinker.pro",
        changeOrigin: true,
      },
      "/upload": {
        target: "https://api.textlinker.pro",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "https://api.textlinker.pro",
        changeOrigin: true,
        ws: true,
      },
      "/_sio": {
        target: "https://api.textlinker.pro",
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/_sio/, '/socket.io'),
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
