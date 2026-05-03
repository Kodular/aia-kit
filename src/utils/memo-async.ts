/**
 * Memoizes async loads by key: stores settled values, coalesces in-flight work per key,
 * and clears the in-flight slot on rejection so the next call can retry.
 */
export function createAsyncMemoByKey<K, V>(
  load: (key: K) => Promise<V>,
): (key: K) => Promise<V> {
  const resolved = new Map<K, V>()
  const pending = new Map<K, Promise<V>>()

  return (key: K): Promise<V> => {
    if (resolved.has(key)) return Promise.resolve(resolved.get(key) as V)

    let p = pending.get(key)
    if (!p) {
      p = load(key)
        .then((value) => {
          resolved.set(key, value)
          pending.delete(key)
          return value
        })
        .catch((error: unknown) => {
          pending.delete(key)
          throw error
        })
      pending.set(key, p)
    }
    return p
  }
}
