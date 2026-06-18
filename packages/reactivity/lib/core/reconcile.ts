export interface ReconcileOptions<T, K = T> {
  key?: (item: T) => K;
}

export type ReconcileOperation<T> =
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

export function createReconcile<T>(tpl: ReconcileTemplate<T>) {
  return (next: readonly T[], output: any[]) => {
    const operations = reconcile(next, output, tpl);
    return operations;
  };
}

interface ReconcileTemplate<T> {
  regions: Region<T>[];
  insert(output: any[], value: T, index: number): void;
}

export function reconcile<T>(
  next: readonly T[],
  output: any[],
  tpl: ReconcileTemplate<T>
): ReconcileOperation<T>[] {
  const operations: ReconcileOperation<T>[] = [];
  const { regions } = tpl;

  let start = 0;
  let currentEnd = regions.length;
  let nextEnd = next.length;

  while (
    start < currentEnd &&
    start < nextEnd &&
    regions[start].key === next[start]
  ) {
    updateIfChanged(operations, regions, next[start], start);
    start++;
  }

  while (
    start < currentEnd &&
    start < nextEnd &&
    regions[currentEnd - 1].key === next[nextEnd - 1]
  ) {
    currentEnd--;
    nextEnd--;
    updateIfChanged(operations, regions, next[nextEnd], currentEnd);
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
      operations.push({ type: 'remove', index: i });
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
      updateIfChanged(operations, regions, value, index);
      continue;
    }

    const from = findKeyIndex(regions, key, index + 1, activeEnd);
    if (from === -1) {
      tpl.insert(output, value, index);
      activeEnd++;
      operations.push({ type: 'insert', index, value });
    } else {
      const [moved] = regions.splice(from, 1);
      regions.splice(index, 0, moved);
      operations.push({ type: 'move', from, to: index });
      updateIfChanged(operations, regions, value, index);
    }
  }

  return operations;
}

function updateIfChanged<T>(
  operations: ReconcileOperation<T>[],
  current: Region<T>[],
  value: T,
  index: number
) {
  if (current[index] !== value) {
    current[index].key = value;
    operations.push({ type: 'update', index, value });
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
