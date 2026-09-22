import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  oxc: {
    include: /\.[jt]sx?$/, // يسمح بتحليل JSX في .js و .ts و .jsx و .tsx
  },
  server: {
    hmr: true, // هذا مفعل تلقائياً
  },
  optimizeDeps: {
    rolldownOptions: {
      moduleTypes: {
        ".js": "jsx",
      },
    },
  },
});
