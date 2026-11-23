import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    platforms: "src/platforms/index.ts",
    analysis: "src/analysis/index.ts",
    formats: "src/formats/index.ts",
  },
  format: "esm",
  platform: "neutral",
  dts: true,
});
