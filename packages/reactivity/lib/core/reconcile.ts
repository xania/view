export interface ReconcileOptions<T, K = T> {
  key?: (item: T) => K;
}

export type ReconcileOperation<T = unknown> =
  | {
      type: 'insert';
      index: number;
      value: T;
    }
  | {
      type: 'remove';
      index: number;
    }
  | {
      type: 'move';
      from: number;
      to: number;
    }
  | {
      type: 'update';
      index: number;
      value: T;
    };

interface Region<K> {
  key: K;
}

interface ReconcileTemplate<T> {
  regions: Region<T>[];
}

export function* reconcile<T>(
  next: readonly T[],
  tpl: ReconcileTemplate<T>
): Generator<ReconcileOperation<T>, void> {
  const { regions } = tpl;

  let start = 0;
  let currentEnd = regions.length;
  let nextEnd = next.length;

  while (
    start < currentEnd &&
    start < nextEnd &&
    regions[start].key === next[start]
  ) {
    const operation = updateIfChanged(regions, next[start], start);
    if (operation) yield operation;
    start++;
  }

  while (
    start < currentEnd &&
    start < nextEnd &&
    regions[currentEnd - 1].key === next[nextEnd - 1]
  ) {
    currentEnd--;
    nextEnd--;
    const operation = updateIfChanged(regions, next[nextEnd], currentEnd);
    if (operation) yield operation;
  }

  const nextCounts = new Map<T, number>();
  for (let i = start; i < nextEnd; i++) {
    const key = next[i];
    nextCounts.set(key, (nextCounts.get(key) ?? 0) + 1);
  }

  let activeEnd = currentEnd;
  for (let i = currentEnd - 1; i >= start; i--) {
    const key = regions[i].key;
    const count = nextCounts.get(key) ?? 0;
    if (count === 0) {
      regions.splice(i, 1);
      activeEnd--;
      yield { type: 'remove', index: i };
    } else {
      nextCounts.set(key, count - 1);
    }
  }

  for (let index = start; index < nextEnd; index++) {
    const value = next[index];
    const key = value;
    const currentKey =
      index < activeEnd && regions[index] !== undefined
        ? regions[index].key
        : undefined;

    if (currentKey === key) {
      const operation = updateIfChanged(regions, value, index);
      if (operation) yield operation;
      continue;
    }

    const from = findKeyIndex(regions, key, index + 1, activeEnd);
    if (from === -1) {
      activeEnd++;
      yield { type: 'insert', index, value };
    } else {
      const [moved] = regions.splice(from, 1);
      regions.splice(index, 0, moved);
      yield { type: 'move', from, to: index };
      const operation = updateIfChanged(regions, value, index);
      if (operation) yield operation;
    }
  }
}

function updateIfChanged<T>(
  current: Region<T>[],
  value: T,
  index: number
): ReconcileOperation<T> | undefined {
  if (current[index].key !== value) {
    current[index].key = value;
    return { type: 'update', index, value };
  }
}

function findKeyIndex<T>(
  items: readonly Region<T>[],
  key: T,
  start: number,
  end: number
) {
  for (let i = start; i < end; i++) {
    if (items[i].key === key) {
      return i;
    }
  }
  return -1;
}
