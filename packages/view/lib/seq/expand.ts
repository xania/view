import { SequenceIterator } from '../utils/iterator';
import { isIterable } from '../utils/iterator';

export function sexpand<T = any>(
  template: JSX.Sequence<T>,
  map: (x: T, ...args: any[]) => JSX.Sequence<T | void>,
  ...args: any[]
): JSX.MaybePromise<void> {
  return traverse([template]);
  // const stack: JSX.Template<T>[] = [template];
  function traverse(
    stack: JSX.Sequence<T | SequenceIterator<T>>[]
  ): JSX.MaybePromise<void> {
    while (stack.length) {
      const curr = stack.pop()!;

      if (curr === null || curr === undefined) {
        // ignore
      } else if (curr instanceof Array) {
        for (let i = curr.length - 1; i >= 0; i--) {
          stack.push(curr[i]);
        }
      } else if (curr instanceof Promise) {
        return curr.then((resolved) => {
          stack.push(resolved);
          return traverse(stack);
        });
      } else if (curr instanceof SequenceIterator) {
        const next = curr.iter.next();
        if (!next.done) {
          stack.push(curr);
        }
        stack.push(next.value);
      } else if (isIterable(curr)) {
        stack.push(new SequenceIterator<T>(curr as any));
      } else {
        const result = map(curr, ...args);
        if (result !== null && result !== undefined) {
          stack.push(result as any);
        }
      }
    }
  }
}
