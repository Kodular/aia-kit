import { describe, expect, it } from "vitest";
import { ParseError } from "../errors.ts";
import { PROPERTIES } from "../test-helpers.ts";
import { parseProperties, serializeProperties } from "./properties.ts";

describe("parseProperties", () => {
  it("reads known keys into typed fields and keeps the rest in `extra`", () => {
    expect(parseProperties(PROPERTIES)).toEqual({
      main: "appinventor.ai_test.Demo.Screen1",
      name: "Demo",
      versionCode: 3,
      versionName: "1.2",
      usesLocation: false,
      appName: "Demo App",
      icon: "logo.png",
      sizing: "Responsive",
      extra: { assets: "../assets", source: "../src", build: "../build" },
    });
  });

  it("derives the name from `main` when it is missing", () => {
    expect(parseProperties("main=a.b.MyApp.Screen1").name).toBe("MyApp");
  });

  it("leaves unparseable typed values in `extra`", () => {
    const properties = parseProperties("main=a.S\nversioncode=abc\nactionbar=maybe");
    expect(properties.versionCode).toBeUndefined();
    expect(properties.extra).toEqual({ versioncode: "abc", actionbar: "maybe" });
  });

  it("understands Java properties escapes, separators and continuations", () => {
    const properties = parseProperties(
      "main = a.S\n! comment\naname : Caf\\u00e9 \\= \\:\\\\\nlong=one\\\n    two\nkey\\ with\\ space=v\n",
    );
    expect(properties.appName).toBe("Café = :\\");
    expect(properties.extra).toEqual({ long: "onetwo", "key with space": "v" });
  });

  it("throws ParseError without `main`", () => {
    expect(() => parseProperties("name=Demo")).toThrow(ParseError);
  });
});

describe("serializeProperties", () => {
  it("returns the original text for unchanged properties", () => {
    expect(serializeProperties(parseProperties(PROPERTIES))).toBe(PROPERTIES);
  });

  it("writes changed properties in App Inventor's order", () => {
    const properties = { ...parseProperties(PROPERTIES), versionCode: 4, actionBar: true };
    expect(serializeProperties(properties)).toBe(
      [
        "main=appinventor.ai_test.Demo.Screen1",
        "name=Demo",
        "assets=../assets",
        "source=../src",
        "build=../build",
        "versioncode=4",
        "versionname=1.2",
        "useslocation=False",
        "aname=Demo App",
        "icon=logo.png",
        "sizing=Responsive",
        "actionbar=True",
        "",
      ].join("\n"),
    );
  });

  it("escapes what it writes so it reads back the same", () => {
    const properties = {
      main: "a.S",
      name: "S",
      appName: " Café = a:b #1\n",
      extra: { "odd key": "v\\", url: "http://x" },
    };
    expect(parseProperties(serializeProperties(properties))).toEqual(properties);
  });
});
