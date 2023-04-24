export type Collection<T> = T | Collection<T>[];

export function cpush<T>(
  collection: Collection<T> | undefined,
  items: Collection<T>
): Collection<T> | undefined {
  if (items === null || items === undefined) {
    return collection;
  }

  if (collection instanceof Array) {
    collection.push(items);
    return collection;
  } else if (collection) {
    return [collection, items];
  } else {
    return items;
  }
}

export function cflat<T>(collection: Collection<T>): T[] {
  const flat: T[] = [];
  const stack = [collection];
  while (stack.length) {
    const curr = stack.pop()!;
    if (curr instanceof Array) {
      for (let i = curr.length - 1; i >= 0; i--) {
        stack.push(curr[i]);
      }
    } else if (curr) {
      flat.push(curr);
    }
  }
  return flat;
}

export function cwalk<T, U>(
  collection: Collection<T> | undefined,
  walk: (x: T, idx: number) => U
) {
  if (!collection) {
    return;
  }
  let index = 0;
  const stack = [collection];
  while (stack.length) {
    const curr = stack.pop()!;
    if (curr instanceof Array) {
      for (let i = curr.length - 1; i >= 0; i--) {
        const c = curr[i];
        if (c) stack.push(c);
      }
    } else if (curr) {
      walk(curr, index++);
    }
  }
}

export function cfirst<T>(collection: Collection<T>) {
  const stack = [collection];
  while (stack.length) {
    const curr = stack.pop()!;
    if (curr instanceof Array) {
      for (let i = curr.length - 1; i >= 0; i--) {
        stack.push(curr[i]);
      }
    } else if (curr) {
      return curr;
    }
  }
}
