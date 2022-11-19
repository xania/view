export function flatten<T>(tree: T | T[]): T[] {
  const arr: T[] = [];

  const stack: (T | T[])[] = [tree];
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
