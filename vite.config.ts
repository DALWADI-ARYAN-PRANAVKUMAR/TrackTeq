import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    tanstackStart({
      server: { 
        preset: "vercel",
        entry: "src/server.ts" 
      },
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
});
