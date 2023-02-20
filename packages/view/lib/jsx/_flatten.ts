type Tree<T, TArgs extends any[]> =
  | null
  | void
  | T
  | Tree<T, TArgs>[]
  | ((...args: TArgs) => Tree<T, TArgs>);

export function flatten<T, TArgs extends any[]>(
  tree: Tree<T, TArgs>,
  ...args: TArgs
): T[] {
  const retval: T[] = [];

  const stack: Tree<T, TArgs>[] = [tree];
  while (stack.length) {
    const curr = stack.pop();
    if (curr instanceof Array) {
      for (let i = curr.length - 1; i >= 0; i--) {
        stack.push(curr[i]);
      }
    } else if (curr instanceof Function) {
      stack.push(curr(...args));
    } else if (curr) {
      retval.push(curr);
    }
  }

  return retval;
}

export function flatMap<T>(tree: JSX.Tree<T>): T[] {
  const arr: T[] = [];

  const stack: JSX.Tree<T>[] = [tree];
  while (stack.length) {
    const curr = stack.pop();
    if (curr instanceof Array) {
      for (let i = curr.length - 1; i >= 0; i--) {
        stack.push(curr[i]);
      }
    } else if (curr) {
      arr.push(curr);
    }
  }

  return arr;
}
