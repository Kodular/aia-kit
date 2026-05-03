export function findUniqueName(base: string, existing: readonly string[]): string {
  const names = new Set(existing)
  let i = 2
  let candidate = `${base}_${i}`
  while (names.has(candidate)) {
    i += 1
    candidate = `${base}_${i}`
  }
  return candidate
}
