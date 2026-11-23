import type { Project, ProjectProperties } from "../types.ts";

/**
 * Changes project properties. Given fields replace the current ones; `extra`
 * entries are merged key by key.
 */
export function setProjectProperties(
  project: Project,
  changes: Partial<ProjectProperties>,
): Project {
  return {
    ...project,
    properties: {
      ...project.properties,
      ...changes,
      extra: { ...project.properties.extra, ...changes.extra },
    },
  };
}
