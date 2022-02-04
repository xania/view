export function createLookup<K, T>() {
  const lookup = new Map<K, T[]>();
  return {
    get(key: K) {
      return lookup.get(key);
    },
    append(key: K, value: T) {
      const values = lookup.get(key);
      if (values) {
        values.push(value);
      } else {
        lookup.set(key, [value]);
      }
    },
    prepend(key: K, value: T) {
      const values = lookup.get(key);
      if (values) {
        values.unshift(value);
      } else {
        lookup.set(key, [value]);
      }
    },
  };
}
