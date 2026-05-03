export class AiaKitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AiaKitError'
  }
}

export class AiaParseError extends AiaKitError {
  cause: unknown
  constructor(message: string, cause: unknown) {
    super(message)
    this.name = 'AiaParseError'
    this.cause = cause
  }
}

export class AiaZipError extends AiaParseError {
  constructor(message: string, cause: unknown) {
    super(message, cause)
    this.name = 'AiaZipError'
  }
}

export class AiaStructureError extends AiaParseError {
  constructor(message: string, cause: unknown) {
    super(message, cause)
    this.name = 'AiaStructureError'
  }
}

export class AiaWriteError extends AiaKitError {
  constructor(message: string) {
    super(message)
    this.name = 'AiaWriteError'
  }
}

export class EnvironmentConstructionError extends AiaKitError {
  constructor(message: string) {
    super(message)
    this.name = 'EnvironmentConstructionError'
  }
}
