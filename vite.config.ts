import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    commonjsOptions: {
      strictRequires: true,
    },
  },
  define: {
    // https://github.com/permafrost-dev/vue-ray/issues/3#issuecomment-1055944939
    global: "window",
    "process.env": {},
  },
  base: './',
});
