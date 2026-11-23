import type { Problem } from "./problems.ts";
import { walkBlocks, walkComponents } from "./query.ts";
import type { Project } from "./types.ts";

export type SecretProblem = Extract<Problem, { code: "possible-secret" }>;

/** Formats that identify a credential on sight. Order matters only for which name is reported first. */
const PATTERNS: readonly (readonly [kind: string, pattern: RegExp])[] = [
  ["private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["AWS access key", /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
  ["GitHub token", /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})\b/],
  ["Anthropic API key", /\bsk-ant-[A-Za-z0-9_-]{20,}/],
  ["OpenAI API key", /\bsk-(?!ant-)[A-Za-z0-9_-]{20,}/],
  ["Slack token", /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ["Stripe live key", /\b[sr]k_live_[0-9A-Za-z]{16,}/],
  ["SendGrid API key", /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/],
  ["Twilio account SID", /\bAC[0-9a-f]{32}\b/],
  ["Telegram bot token", /\b\d{8,10}:[A-Za-z0-9_-]{35}\b/],
  ["JSON Web Token", /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
  ["bearer token", /\bBearer\s+[A-Za-z0-9._~+/-]{20,}=*/],
  ["URL with embedded credentials", /\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:[^\s/:@]+@[^\s/]+/i],
  [
    "credential in a URL",
    /[?&](?:api[_-]?key|apikey|key|token|access[_-]?token|auth|secret|password|passwd)=([^&\s#]{8,})/i,
  ],
];

/** Property names that hold credentials by convention: `FirebaseToken`, `ConsumerSecret`, `ApiKey`. */
const SENSITIVE_PROPERTY = /(?:Token|Secret|Password|Key)$/;
/** Variable names that suggest a credential. */
const SENSITIVE_VARIABLE = /token|secret|password|passwd|api[_-]?key/i;
/** Values that cannot be credentials: empty, short, booleans, plain numbers. */
const TRIVIAL = /^(?:.{0,7}|true|false|-?\d+(?:\.\d+)?)$/is;

/** `AIzaSyExample…` → `AIza…ple`: enough to recognise the value without repeating it. */
function mask(value: string): string {
  const text = value.trim();
  return text.length > 12 ? `${text.slice(0, 4)}…${text.slice(-3)}` : "…";
}

/**
 * Finds values that look like credentials — API keys, tokens, passwords —
 * stored in the project, where anyone holding the `.aia` (or the built app)
 * can read them. Looks at project properties, component properties, and text
 * blocks. Matching is by known formats and by telling names, so it can both
 * miss secrets and flag harmless values.
 */
export function findSecrets(project: Project): SecretProblem[] {
  const found: SecretProblem[] = [];

  const report = (
    kind: string,
    value: string,
    place: string,
    location: Pick<SecretProblem, "screen" | "component" | "property" | "blockId">,
  ) => {
    found.push({
      code: "possible-secret",
      severity: "warning",
      kind,
      preview: mask(value),
      ...location,
      message: `Possible ${kind} in ${place}: ${mask(value)}`,
    });
  };

  /** Reports the first known format found in `value`; returns whether there was one. */
  const scan = (value: string, place: string, location: Parameters<typeof report>[3]): boolean => {
    for (const [kind, pattern] of PATTERNS) {
      const match = pattern.exec(value);
      if (!match) continue;
      // A pattern may capture just the secret part of what it matched.
      report(kind, match[1] ?? match[0], place, location);
      return true;
    }
    return false;
  };

  const { extra, ...known } = project.properties;
  for (const [property, value] of Object.entries({ ...known, ...extra })) {
    if (typeof value === "string") scan(value, `project property "${property}"`, { property });
  }

  for (const screen of project.screens) {
    for (const component of walkComponents(screen)) {
      const owner =
        component.name === screen.name ? screen.name : `${screen.name}.${component.name}`;
      for (const [property, value] of Object.entries(component.properties)) {
        const location = { screen: screen.name, component: component.name, property };
        const place = `${owner}.${property}`;
        if (scan(value, place, location)) continue;
        if (SENSITIVE_PROPERTY.test(property) && !TRIVIAL.test(value)) {
          report("secret", value, place, location);
        }
      }
    }

    for (const block of walkBlocks(screen)) {
      const location = { screen: screen.name, ...(block.id !== "" && { blockId: block.id }) };
      if (block.type === "text") {
        scan(block.fields["TEXT"] ?? "", `a text block in ${screen.name}`, location);
      } else if (block.type === "global_declaration") {
        // A literal assigned to a variable whose name says it is a credential.
        const name = block.fields["NAME"] ?? "";
        const value = block.values["VALUE"];
        const text = value?.type === "text" ? (value.fields["TEXT"] ?? "") : "";
        const known = PATTERNS.some(([, pattern]) => pattern.test(text));
        if (!known && SENSITIVE_VARIABLE.test(name) && !TRIVIAL.test(text)) {
          report("secret", text, `global variable "${name}" in ${screen.name}`, {
            screen: screen.name,
            ...(value && value.id !== "" && { blockId: value.id }),
          });
        }
      }
    }
  }

  return found;
}
