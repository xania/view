export interface Disposable {
  dispose(): void;
}

export interface Removable {
  remove(): void;
}

type Tree<T> = null | T | Tree<T>[];

export function disposeAll(items: Tree<Disposable>) {
  const stack: Tree<Disposable> = [items];

  while (stack.length > 0) {
    const curr = stack.pop();
    if (curr) {
      if (curr instanceof Array) {
        for (const e of curr) stack.push(e);
      } else if (curr.dispose instanceof Function) {
        curr.dispose();
      }
    }
  }
}
