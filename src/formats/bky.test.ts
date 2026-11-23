import { describe, expect, it } from "vitest";
import { ParseError } from "../errors.ts";
import { BKY } from "../test-helpers.ts";
import { parseBky, serializeBky } from "./bky.ts";

describe("parseBky", () => {
  it("reads top-level blocks and workspace metadata", () => {
    const { blocks, meta } = parseBky(BKY);
    expect(blocks.map((b) => b.type)).toEqual([
      "global_declaration",
      "component_event",
      "procedures_defnoreturn",
      "math_number",
    ]);
    expect(meta).toEqual({
      xmlns: "http://www.w3.org/1999/xhtml",
      versions: { "ya-version": "232", "language-version": "37" },
    });
  });

  it("reads fields, inputs, mutations and attributes", () => {
    const [global, event, procedure] = parseBky(BKY).blocks;
    expect(global).toMatchObject({
      id: "g1",
      x: 10,
      y: 10,
      inline: false,
      fields: { NAME: "count" },
    });
    expect(global?.values["VALUE"]).toMatchObject({ type: "math_number", fields: { NUM: "0" } });

    expect(event?.mutation).toEqual({
      component_type: "Button",
      is_generic: "false",
      instance_name: "Button1",
      event_name: "Click",
    });
    const setter = event?.statements["DO"];
    expect(setter?.type).toBe("component_set_get");
    expect(setter?.next?.next?.type).toBe("controls_openAnotherScreen");

    expect(procedure).toMatchObject({
      collapsed: true,
      mutation: {},
      mutationChildren: [{ tag: "arg", attributes: { name: "x" }, children: [] }],
      comment: { text: "a & b <c>", attributes: { pinned: "false", h: "80", w: "160" } },
    });
  });

  it("treats an empty file as an empty workspace", () => {
    expect(parseBky("")).toEqual({ blocks: [], meta: {} });
    expect(serializeBky(parseBky(""))).toBe("");
  });

  it("reads legacy <title> as a field", () => {
    const { blocks } = parseBky(
      '<xml><block type="math_number"><title name="NUM">5</title></block></xml>',
    );
    expect(blocks[0]).toMatchObject({ id: "", fields: { NUM: "5" } });
  });

  it("keeps unknown attributes and elements", () => {
    const text =
      '<xml><variables><variable id="v">a</variable></variables>' +
      '<block type="t" id="1" deletable="false"><data>d</data></block></xml>';
    const doc = parseBky(text);
    expect(doc.blocks[0]?.extraAttributes).toEqual({ deletable: "false" });
    expect(doc.blocks[0]?.extraChildren).toEqual([
      { tag: "data", attributes: {}, children: ["d"] },
    ]);
    expect(doc.meta.extra?.[0]?.tag).toBe("variables");
    expect(parseBky(serializeBky(structuredClone(doc)))).toEqual(doc);
  });

  it.each([
    ["malformed XML", "<xml><block></xml>"],
    ["a different root", "<html></html>"],
    ["plain text", "not xml"],
  ])("throws ParseError for %s", (_, text) => {
    expect(() => parseBky(text)).toThrow(ParseError);
  });
});

describe("serializeBky", () => {
  it("returns the original text for an unchanged document", () => {
    expect(serializeBky(parseBky(BKY))).toBe(BKY);
  });

  it("round-trips through a fresh serialization", () => {
    const doc = parseBky(BKY);
    const text = serializeBky(structuredClone(doc));
    expect(text).not.toBe(BKY);
    expect(text).toContain("a &amp; b &lt;c&gt;");
    expect(parseBky(text)).toEqual(doc);
  });

  it("escapes attribute values", () => {
    const doc = parseBky('<xml><block type="t" id="a&quot;&lt;b"></block></xml>');
    expect(doc.blocks[0]?.id).toBe('a"<b');
    expect(parseBky(serializeBky(structuredClone(doc)))).toEqual(doc);
  });
});
