type ListItem<T> = T extends Array<infer E> ? E : T;

export function push2<T, K extends keyof T>(
  object: T,
  key: K | symbol,
  item: ListItem<T[K]>
) {
  if (item === null || item === undefined) {
    return;
  }

  const collection = (object as any)[key];
  if (collection) {
    if (collection instanceof Array) {
      collection.push(item);
    } else {
      (object as any)[key] = [collection, item] as any;
    }
  } else {
    (object as any)[key] = item;
  }
}
