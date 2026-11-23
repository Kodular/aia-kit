interface ProblemBase {
  readonly severity: "error" | "warning";
  /** Human-readable description. */
  readonly message: string;
}

/**
 * A finding about a project's data. Problems never stop you from reading or
 * writing; switch on `code` to handle specific ones.
 */
export type Problem = ProblemBase &
  (
    | {
        /** A screen could not be read; its files are kept in `otherFiles`. */
        readonly code: "unreadable-screen";
        readonly screen: string;
        readonly reason: "missing-scm" | "missing-bky" | "malformed-scm" | "malformed-bky";
      }
    | {
        /** An extension could not be read; its files are kept in `otherFiles`. */
        readonly code: "unreadable-extension";
        readonly extension: string;
      }
    | { readonly code: "missing-main-screen"; readonly screen: string }
    | { readonly code: "duplicate-screen"; readonly screen: string }
    | { readonly code: "screen-name-mismatch"; readonly screen: string; readonly formName: string }
    | { readonly code: "duplicate-component"; readonly screen: string; readonly component: string }
    | {
        /** A block refers to a component that is not on the screen. */
        readonly code: "dangling-block-reference";
        readonly screen: string;
        readonly blockId: string;
        readonly component: string;
      }
    | {
        readonly code: "unknown-component-type";
        readonly screen: string;
        readonly component: string;
        readonly type: string;
      }
    | {
        readonly code: "unknown-property";
        readonly screen: string;
        readonly component: string;
        readonly property: string;
      }
    | {
        readonly code: "missing-asset";
        readonly screen: string;
        readonly component: string;
        readonly property: string;
        readonly asset: string;
      }
    | {
        /**
         * A value that looks like a credential (API key, token, password) is
         * stored in the project, where anyone holding the file can read it.
         * A heuristic: it can miss secrets and flag harmless values.
         */
        readonly code: "possible-secret";
        /** What it looks like, e.g. `Google API key`, or just `secret`. */
        readonly kind: string;
        /** The value with its middle masked, e.g. `AIza…x9Q`. */
        readonly preview: string;
        /** Absent for project properties. */
        readonly screen?: string;
        readonly component?: string;
        /** The project or component property holding the value. */
        readonly property?: string;
        /** The text block holding the value. */
        readonly blockId?: string;
      }
  );

export type ProblemCode = Problem["code"];
