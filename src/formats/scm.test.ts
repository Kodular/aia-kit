import { describe, expect, it } from "vitest";
import { ParseError } from "../errors.ts";
import { SCM } from "../test-helpers.ts";
import { parseScm, serializeScm } from "./scm.ts";

describe("parseScm", () => {
  it("reads the component tree and header", () => {
    const { form, meta } = parseScm(SCM);
    expect(meta).toEqual({
      authURL: ["ai2.appinventor.mit.edu"],
      YaVersion: "232",
      Source: "Form",
    });
    expect(form).toMatchObject({ name: "Screen1", type: "Form", version: "31", uuid: "0" });
    expect(form.properties).toEqual({ AppName: "Demo", Title: "Screen1" });
    expect(form.children.map((c) => c.name)).toEqual(["Row", "Ext1"]);
    expect(form.children[0]?.children[0]).toEqual({
      name: "Button1",
      type: "Button",
      version: "7",
      uuid: "101",
      properties: { Image: "logo.png", Text: "Go" },
      children: [],
    });
  });

  it("keeps non-string and unknown values in `extra`", () => {
    const { form } = parseScm(
      `#|\n$JSON\n{"Properties":{"$Name":"S","$Type":"Form","Count":3,"$Odd":"x","Uuid":"0"}}\n|#`,
    );
    expect(form.properties).toEqual({});
    expect(form.extra).toEqual({ Count: 3, $Odd: "x" });
    expect(serializeScm(structuredClone({ form, meta: {} }))).toContain('"Count":3,"$Odd":"x"');
  });

  it("returns frozen data", () => {
    const { form } = parseScm(SCM);
    expect(Object.isFrozen(form.children[0]?.properties)).toBe(true);
  });

  it.each([
    ["no wrapper", "{}"],
    ["invalid JSON", "#|\n$JSON\n{oops\n|#"],
    ["no Properties", '#|\n$JSON\n{"YaVersion":"1"}\n|#'],
    ["component without $Type", '#|\n$JSON\n{"Properties":{"$Name":"S"}}\n|#'],
  ])("throws ParseError for %s", (_, text) => {
    expect(() => parseScm(text)).toThrow(ParseError);
  });
});

describe("serializeScm", () => {
  it("returns the original text for an unchanged document", () => {
    const odd = SCM.replace("$JSON\n", "$JSON\n  ") + "\n";
    expect(serializeScm(parseScm(odd))).toBe(odd);
  });

  it("re-serializes a changed document to an equivalent one", () => {
    const doc = parseScm(SCM);
    const changed = {
      ...doc,
      form: { ...doc.form, properties: { ...doc.form.properties, Title: "Hi" } },
    };
    const text = serializeScm(changed);
    expect(text).not.toBe(SCM);
    expect(parseScm(text)).toEqual(changed);
  });

  it("round-trips through a fresh serialization", () => {
    const doc = parseScm(SCM);
    expect(parseScm(serializeScm(structuredClone(doc)))).toEqual(doc);
  });
});
