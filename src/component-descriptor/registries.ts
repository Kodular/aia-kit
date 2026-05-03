import type { ComponentDescriptor } from './descriptors.js'

// ── ComponentRegistry ──────────────────────────────────────────────────────

export class ComponentRegistry {
  readonly #descriptors: ReadonlyArray<ComponentDescriptor>
  readonly #byTypeOrName: ReadonlyMap<string, ComponentDescriptor>

  protected constructor(descriptors: Iterable<ComponentDescriptor>) {
    const snapshot = Object.freeze([...descriptors])
    const byTypeOrName = new Map<string, ComponentDescriptor>()
    for (const descriptor of snapshot) {
      byTypeOrName.set(descriptor.type, descriptor)
      byTypeOrName.set(descriptor.name, descriptor)
    }
    this.#descriptors = snapshot
    this.#byTypeOrName = byTypeOrName
  }

  static of(descriptors: Iterable<ComponentDescriptor>): ComponentRegistry {
    return new ComponentRegistry(descriptors)
  }

  get descriptors(): ReadonlyArray<ComponentDescriptor> {
    return this.#descriptors
  }

  lookup(typeOrName: string): ComponentDescriptor | null {
    return this.#byTypeOrName.get(typeOrName) ?? null
  }

  has(typeOrName: string): boolean {
    return this.#byTypeOrName.has(typeOrName)
  }

  toMutable(): MutableComponentRegistry {
    return new MutableComponentRegistry(this.#descriptors)
  }
}

export class MutableComponentRegistry extends ComponentRegistry {
  readonly #descriptors: ComponentDescriptor[]

  constructor(descriptors: Iterable<ComponentDescriptor> = []) {
    const snapshot = [...descriptors]
    super(snapshot)
    this.#descriptors = snapshot
  }

  override get descriptors(): ReadonlyArray<ComponentDescriptor> {
    return Object.freeze([...this.#descriptors])
  }

  override lookup(typeOrName: string): ComponentDescriptor | null {
    return this.#descriptors.find(
      descriptor => descriptor.type === typeOrName || descriptor.name === typeOrName,
    ) ?? null
  }

  override has(typeOrName: string): boolean {
    return this.lookup(typeOrName) !== null
  }

  override toMutable(): MutableComponentRegistry {
    return new MutableComponentRegistry(this.#descriptors)
  }

  add(descriptors: ComponentDescriptor | readonly ComponentDescriptor[]): void {
    const nextDescriptors = Array.isArray(descriptors) ? descriptors : [descriptors]
    for (const descriptor of nextDescriptors) {
      this.remove(descriptor.type)
      this.remove(descriptor.name)
      this.#descriptors.push(descriptor)
    }
  }

  remove(typeOrNames: string | readonly string[]): boolean {
    const names = Array.isArray(typeOrNames) ? typeOrNames : [typeOrNames]
    let removed = false
    for (const typeOrName of names) {
      let index = this.#descriptors.findIndex(
        descriptor => descriptor.type === typeOrName || descriptor.name === typeOrName,
      )
      while (index !== -1) {
        this.#descriptors.splice(index, 1)
        removed = true
        index = this.#descriptors.findIndex(
          descriptor => descriptor.type === typeOrName || descriptor.name === typeOrName,
        )
      }
    }
    return removed
  }

  snapshot(): ComponentRegistry {
    return ComponentRegistry.of(this.#descriptors)
  }
}
