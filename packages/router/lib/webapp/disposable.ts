export type Tree<T> = undefined | null | T | Tree<T>[] | Promise<Tree<T>>;

export interface Disposable {
  dispose(): void;
}

export function disposeAll(
  items?: Tree<Promise<Disposable | null> | Disposable | null>
) {
  const stack = [items];

  while (stack.length > 0) {
    const curr = stack.pop();
    if (curr) {
      if (curr instanceof Array) {
        for (const e of curr) stack.push(e);
      } else if (curr instanceof Promise) {
        curr.then(disposeAll);
      } else if (curr?.dispose instanceof Function) {
        curr.dispose();
      }
    }
  }
}
