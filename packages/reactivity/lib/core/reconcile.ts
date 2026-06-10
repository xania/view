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

export function createReconcile<T, K = T>(options?: ReconcileOptions<T, K>) {
  let previous: readonly T[] | undefined;

  return (next: readonly T[]) => {
    const operations = reconcile(next, previous, options);
    previous = next;
    return operations;
  };
}

export function reconcile<T, K = T>(
  next: readonly T[],
  prev: readonly T[] = [],
  options?: ReconcileOptions<T, K>
): ReconcileOperation<T>[] {
  const keyOf = options?.key ?? ((item: T) => item as unknown as K);
  const current = prev.slice();
  const operations: ReconcileOperation<T>[] = [];

  let start = 0;
  let currentEnd = current.length;
  let nextEnd = next.length;

  while (
    start < currentEnd &&
    start < nextEnd &&
    keyOf(current[start]) === keyOf(next[start])
  ) {
    updateIfChanged(operations, current, next[start], start);
    start++;
  }

  while (
    start < currentEnd &&
    start < nextEnd &&
    keyOf(current[currentEnd - 1]) === keyOf(next[nextEnd - 1])
  ) {
    currentEnd--;
    nextEnd--;
    updateIfChanged(operations, current, next[nextEnd], currentEnd);
  }

  const nextCounts = new Map<K, number>();
  for (let i = start; i < nextEnd; i++) {
    const key = keyOf(next[i]);
    nextCounts.set(key, (nextCounts.get(key) ?? 0) + 1);
  }

  let activeEnd = currentEnd;
  for (let i = currentEnd - 1; i >= start; i--) {
    const key = keyOf(current[i]);
    const count = nextCounts.get(key) ?? 0;
    if (count === 0) {
      current.splice(i, 1);
      activeEnd--;
      operations.push({ type: 'remove', index: i });
    } else {
      nextCounts.set(key, count - 1);
    }
  }

  for (let index = start; index < nextEnd; index++) {
    const value = next[index];
    const key = keyOf(value);
    const currentKey =
      index < activeEnd && current[index] !== undefined
        ? keyOf(current[index])
        : undefined;

    if (currentKey === key) {
      updateIfChanged(operations, current, value, index);
      continue;
    }

    const from = findKeyIndex(current, key, keyOf, index + 1, activeEnd);
    if (from === -1) {
      current.splice(index, 0, value);
      activeEnd++;
      operations.push({ type: 'insert', index, value });
    } else {
      const [moved] = current.splice(from, 1);
      current.splice(index, 0, moved);
      operations.push({ type: 'move', from, to: index });
      updateIfChanged(operations, current, value, index);
    }
  }

  return operations;
}

function updateIfChanged<T>(
  operations: ReconcileOperation<T>[],
  current: T[],
  value: T,
  index: number
) {
  if (current[index] !== value) {
    current[index] = value;
    operations.push({ type: 'update', index, value });
  }
}

function findKeyIndex<T, K>(
  items: readonly T[],
  key: K,
  keyOf: (item: T) => K,
  start: number,
  end: number
) {
  for (let i = start; i < end; i++) {
    if (keyOf(items[i]) === key) {
      return i;
    }
  }
  return -1;
}
