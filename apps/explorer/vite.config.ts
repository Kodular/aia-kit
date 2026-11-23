import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import solid from "@solidjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const kit = (path: string) => fileURLToPath(new URL(`../../src/${path}`, import.meta.url));

const root = fileURLToPath(new URL("../..", import.meta.url));
const library = JSON.parse(readFileSync(`${root}/package.json`, "utf8")) as {
  version: string;
  repository: { url: string };
};

/** The commit being built: from CI when it says, otherwise from git, otherwise unknown. */
function commit(): string {
  if (process.env["GITHUB_SHA"]) return process.env["GITHUB_SHA"];
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  // Facts about this build, shown in the About dialog. Declared in src/build-info.d.ts.
  define: {
    __AIA_KIT_VERSION__: JSON.stringify(library.version),
    __COMMIT__: JSON.stringify(commit()),
    __REPOSITORY__: JSON.stringify(
      library.repository.url.replace(/^git\+/, "").replace(/\.git$/, ""),
    ),
    __BUILT_AT__: JSON.stringify(new Date().toISOString()),
  },
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
