export function toArray<T extends Node>(nodes: ArrayLike<T>) {
  const result: T[] = [];
  const length = nodes.length;
  for (let i = 0; i < length; i++) {
    result.push(nodes[i]);
  }
  return result;
}

export function selectMany<T, P>(
  source: (T | undefined)[],
  selector: (x: T) => (P | undefined)[]
): P[] {
  const result: P[] = [];

  for (const x of source) {
    if (x) {
      const members = selector(x);
      for (const m of members) {
        if (m) result.push(m);
      }
    }
  }

  return result;
}

export function distinct<T>(source: T[]) {
  return new Set<T>(source);
}
