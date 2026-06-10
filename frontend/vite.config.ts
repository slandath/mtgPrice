import path from "node:path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    allowedHosts: ["app", ".railway.app", "mtgprice.tomslanda.com"],
    proxy: {
      "/api": {
        target: "http://localhost:3000",
      },
    },
    hmr: {
      host: "localhost",
      port: 5173,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
