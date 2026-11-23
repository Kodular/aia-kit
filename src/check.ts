import { lookupComponent, type Platform } from "./platforms/platform.ts";
import type { Problem } from "./problems.ts";
import { componentReference, mainScreenName, walkBlocks, walkComponents } from "./query.ts";
import type { Project } from "./types.ts";

/**
 * Looks for problems in a project. Without a platform only structural checks
 * run; with one, component types, properties and asset references are checked
 * against the platform's (and the project's extensions') descriptors.
 */
export function check(project: Project, platform?: Platform): Problem[] {
  const problems: Problem[] = [];
  const assets = new Set(project.assets.map((asset) => asset.name));
  const seenScreens = new Set<string>();

  const main = mainScreenName(project);
  if (!project.screens.some((screen) => screen.name === main)) {
    problems.push({
      code: "missing-main-screen",
      severity: "error",
      screen: main,
      message: `Main screen "${main}" does not exist`,
    });
  }

  for (const screen of project.screens) {
    const { name } = screen;
    if (seenScreens.has(name)) {
      problems.push({
        code: "duplicate-screen",
        severity: "error",
        screen: name,
        message: `There is more than one screen named "${name}"`,
      });
    }
    seenScreens.add(name);

    if (screen.form.name !== name) {
      problems.push({
        code: "screen-name-mismatch",
        severity: "error",
        screen: name,
        formName: screen.form.name,
        message: `Screen "${name}" has a form named "${screen.form.name}"`,
      });
    }

    const names = new Set<string>();
    for (const component of walkComponents(screen)) {
      if (names.has(component.name)) {
        problems.push({
          code: "duplicate-component",
          severity: "error",
          screen: name,
          component: component.name,
          message: `${name} has more than one component named "${component.name}"`,
        });
      }
      names.add(component.name);
      if (!platform) continue;

      const descriptor = lookupComponent(component.type, platform, project);
      if (!descriptor) {
        problems.push({
          code: "unknown-component-type",
          severity: "warning",
          screen: name,
          component: component.name,
          type: component.type,
          message: `${at(name, component.name)} has type "${component.type}", which ${platform.name} does not provide`,
        });
        continue;
      }
      for (const [property, value] of Object.entries(component.properties)) {
        const editor = descriptor.properties.find((p) => p.name === property)?.editorType;
        // Layout properties such as Width, Row and Column are only listed as block properties.
        const known =
          editor !== undefined || descriptor.blockProperties.some((p) => p.name === property);
        if (!known) {
          problems.push({
            code: "unknown-property",
            severity: "warning",
            screen: name,
            component: component.name,
            property,
            message: `${descriptor.name} has no property "${property}" (${at(name, component.name)})`,
          });
        } else if (
          editor !== undefined &&
          isAssetEditor(editor) &&
          isLocalFile(value) &&
          !assets.has(value)
        ) {
          problems.push({
            code: "missing-asset",
            severity: "warning",
            screen: name,
            component: component.name,
            property,
            asset: value,
            message: `${at(name, component.name)}.${property} refers to missing asset "${value}"`,
          });
        }
      }
    }

    for (const block of walkBlocks(screen)) {
      const instance = componentReference(block)?.instance;
      if (instance === undefined || names.has(instance)) continue;
      problems.push({
        code: "dangling-block-reference",
        severity: "error",
        screen: name,
        blockId: block.id,
        component: instance,
        message: `A ${block.type} block in ${name} refers to missing component "${instance}"`,
      });
    }
  }

  return problems;
}

/** `Screen1.Button1`, or just `Screen1` for the screen's own form, which shares its name. */
function at(screen: string, component: string): string {
  return component === screen ? screen : `${screen}.${component}`;
}

function isAssetEditor(editorType: string): boolean {
  return editorType === "asset" || editorType.endsWith("_asset");
}

function isLocalFile(value: string): boolean {
  return value !== "" && !/^[a-z][a-z0-9+.-]*:|^\/\//i.test(value);
}
