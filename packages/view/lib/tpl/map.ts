import { isIterable } from './utils';

export function tmap<T, U>(
  template: JSX.Template<T>,
  map: (x: T) => U
): JSX.Template<U> {
  const retval: JSX.Template<U>[] = [];
  const stack = [template];
  while (stack.length) {
    const curr = stack.pop()!;

    if (curr === null || curr === undefined) {
      // ignore
    } else if (curr instanceof Array) {
      for (let i = curr.length - 1; i >= 0; i--) {
        stack.push(curr[i]);
      }
    } else if (curr instanceof Promise) {
      retval.push(curr.then((resolved) => tmap(resolved, map)));
    } else if (isIterable(curr)) {
      // console.log('async iter', curr);
      const arr: any[] = [];
      for (const x of curr) {
        if (x) arr.unshift(x);
      }
      stack.push(...arr);
    } else {
      retval.push(map(curr));
    }
  }

  return retval;
}
