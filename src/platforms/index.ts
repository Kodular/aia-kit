/**
 * Component descriptors for App Inventor distributions. Needed only for
 * checks that depend on what components exist; reading, editing and writing
 * projects works without a platform.
 * @module
 */
import { parseComponentDescriptors } from "../formats/descriptors.ts";
import { definePlatform, type Platform } from "./platform.ts";

export { definePlatform, lookupComponent, type Platform } from "./platform.ts";
export { parseComponentDescriptors } from "../formats/descriptors.ts";

export type BuiltinPlatformId = "app-inventor" | "kodular";

const loaders: Record<BuiltinPlatformId, () => Promise<Platform>> = {
  "app-inventor": async () =>
    definePlatform({
      id: "app-inventor",
      name: "MIT App Inventor",
      components: parseComponentDescriptors((await import("./data/app-inventor.json")).default),
    }),
  kodular: async () =>
    definePlatform({
      id: "kodular",
      name: "Kodular Creator",
      components: parseComponentDescriptors((await import("./data/kodular.json")).default),
    }),
};

const loaded = new Map<BuiltinPlatformId, Promise<Platform>>();

/** Loads a bundled platform. The descriptor data is fetched on first use and then shared. */
export function loadPlatform(id: BuiltinPlatformId): Promise<Platform> {
  let platform = loaded.get(id);
  if (!platform) {
    platform = loaders[id]();
    platform.catch(() => loaded.delete(id));
    loaded.set(id, platform);
  }
  return platform;
}
