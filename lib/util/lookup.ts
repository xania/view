export function createLookup<K, T>() {
  const lookup = new Map<K, T[]>();
  return {
    get(key: K) {
      return lookup.get(key);
    },
    add(key: K, value: T) {
      const values = lookup.get(key);
      if (values) {
        values.push(value);
      } else {
        lookup.set(key, [value]);
      }
    },
  };
}
