import { fileURLToPath } from "node:url";
import solid from "@solidjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const kit = (path: string) => fileURLToPath(new URL(`../../src/${path}`, import.meta.url));

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  resolve: {
    // Use the library's source directly, so the app never needs a prior `pnpm build`.
    alias: [
      { find: /^aia-kit$/, replacement: kit("index.ts") },
      { find: /^aia-kit\/platforms$/, replacement: kit("platforms/index.ts") },
      { find: /^aia-kit\/analysis$/, replacement: kit("analysis/index.ts") },
      { find: /^aia-kit\/formats$/, replacement: kit("formats/index.ts") },
    ],
  },
  server: {
    fs: { allow: ["../.."] },
  },
});
