import { describe, expect, it } from "vitest";
import { readAia } from "./archive/read.ts";
import { check } from "./check.ts";
import { setProperty } from "./edit/components.ts";
import { setProjectProperties } from "./edit/properties.ts";
import { findSecrets } from "./secrets.ts";
import { AIA_FIXTURES, EMPTY_SCM, demoProject, fixture, screen } from "./test-helpers.ts";

// Built at runtime so the repository itself never contains something that looks like a live key.
const GOOGLE_KEY = `AIza${"Sy0aB_".repeat(6)}`.slice(0, 39);
const STRIPE_KEY = `sk_${"live"}_${"4eC39HqLyjWDarjt".repeat(2)}`;
const AWS_EXAMPLE = "AKIAIOSFODNN7EXAMPLE"; // AWS's documented example key

const textBlock = (id: string, text: string) =>
  `<block type="text" id="${id}"><field name="TEXT">${text}</field></block>`;
const withBlocks = (xml: string) => ({
  ...demoProject(),
  screens: [screen("Screen1", EMPTY_SCM, `<xml>${xml}</xml>`)],
  extensions: [],
});

describe("findSecrets", () => {
  it("finds nothing in an ordinary project", () => {
    expect(findSecrets(demoProject())).toEqual([]);
  });

  it("recognises known key formats in component properties, with the value masked", () => {
    const project = setProperty(demoProject(), "Screen1", "Button1", "Text", `key=${GOOGLE_KEY}`);
    expect(findSecrets(project)).toEqual([
      {
        code: "possible-secret",
        severity: "warning",
        kind: "Google API key",
        preview: `AIza…${GOOGLE_KEY.slice(-3)}`,
        screen: "Screen1",
        component: "Button1",
        property: "Text",
        message: `Possible Google API key in Screen1.Button1.Text: AIza…${GOOGLE_KEY.slice(-3)}`,
      },
    ]);
    expect(JSON.stringify(findSecrets(project))).not.toContain(GOOGLE_KEY);
  });

  it("flags properties that hold credentials by name, but not their trivial values", () => {
    let project = setProperty(
      demoProject(),
      "Screen1",
      "Button1",
      "FirebaseToken",
      "a-long-opaque-value-123",
    );
    project = setProperty(project, "Screen1", "Button1", "ConsumerSecret", "");
    project = setProperty(project, "Screen1", "Button1", "PasswordVisible", true);
    project = setProperty(project, "Screen1", "Button1", "ApiKey", "short");
    project = setProperty(
      project,
      "Screen1",
      "Screen1",
      "Title",
      "Reset your password and token here",
    );

    expect(findSecrets(project).map((p) => [p.kind, p.component, p.property])).toEqual([
      ["secret", "Button1", "FirebaseToken"],
    ]);
  });

  it("scans text blocks and names the block", () => {
    const project = withBlocks(
      textBlock("a", "hello world") +
        textBlock("b", `https://api.example.com/v1?apikey=0123456789abcdef`) +
        textBlock("c", `https://user:hunter2pass@db.example.com/x`) +
        textBlock("d", AWS_EXAMPLE) +
        textBlock("e", STRIPE_KEY),
    );
    expect(findSecrets(project).map((p) => [p.kind, p.blockId, p.screen])).toEqual([
      ["credential in a URL", "b", "Screen1"],
      ["URL with embedded credentials", "c", "Screen1"],
      ["AWS access key", "d", "Screen1"],
      ["Stripe live key", "e", "Screen1"],
    ]);
  });

  it("flags a literal assigned to a credential-named global, once", () => {
    const global = (name: string, value: string) =>
      `<block type="global_declaration" id="g-${name}"><field name="NAME">${name}</field>` +
      `<value name="VALUE">${textBlock(`v-${name}`, value)}</value></block>`;
    const project = withBlocks(
      global("apiKey", "some-opaque-string-42") +
        global("greeting", "some-opaque-string-42") +
        global("token", GOOGLE_KEY),
    );
    expect(findSecrets(project).map((p) => [p.kind, p.blockId])).toEqual([
      ["secret", "v-apiKey"],
      ["Google API key", "v-token"],
    ]);
  });

  it("scans project properties", () => {
    const project = setProjectProperties(demoProject(), {
      extra: { "custom.endpoint": `https://x.test/?token=${"z".repeat(24)}` },
    });
    expect(findSecrets(project)).toMatchObject([
      { kind: "credential in a URL", property: "custom.endpoint", preview: "zzzz…zzz" },
    ]);
    expect(findSecrets(project)[0]).not.toHaveProperty("screen");
  });

  it("is part of check", () => {
    const project = setProperty(demoProject(), "Screen1", "Button1", "Text", GOOGLE_KEY);
    expect(check(project).map((p) => p.code)).toEqual(["possible-secret"]);
  });

  it.each(AIA_FIXTURES)("reports only by-name findings, if any, in %s", async (path) => {
    const { project } = await readAia(await fixture(path));
    // The fixtures are public tutorial projects: none embeds a recognisable key format.
    expect(findSecrets(project).filter((p) => p.kind !== "secret")).toEqual([]);
  });
});
