/** Base class of every error aia-kit throws on purpose. */
export class AiaKitError extends Error {
  override name = "AiaKitError";
}

/** The input is not a usable archive: not a ZIP, or required entries are missing. */
export class ArchiveError extends AiaKitError {
  override name = "ArchiveError";
}

/** A single file (`.scm`, `.bky`, `project.properties`, component JSON) is malformed. */
export class ParseError extends AiaKitError {
  override name = "ParseError";
  readonly format: "scm" | "bky" | "properties" | "descriptor";

  constructor(format: ParseError["format"], message: string, options?: ErrorOptions) {
    super(message, options);
    this.format = format;
  }
}

export type EntityKind = "screen" | "component" | "asset" | "extension";

/** An edit referred to something that does not exist. */
export class NotFoundError extends AiaKitError {
  override name = "NotFoundError";
  readonly kind: EntityKind;
  readonly entity: string;

  constructor(kind: EntityKind, entity: string, where?: string) {
    super(`No ${kind} named "${entity}"${where ? ` in ${where}` : ""}`);
    this.kind = kind;
    this.entity = entity;
  }
}

/** An edit would create a second thing with the same name. */
export class ConflictError extends AiaKitError {
  override name = "ConflictError";
  readonly kind: EntityKind;
  readonly entity: string;

  constructor(kind: EntityKind, entity: string, where?: string) {
    super(`A ${kind} named "${entity}" already exists${where ? ` in ${where}` : ""}`);
    this.kind = kind;
    this.entity = entity;
  }
}

/** An edit would leave the project in a state App Inventor cannot open. */
export class InvalidOperationError extends AiaKitError {
  override name = "InvalidOperationError";
}
