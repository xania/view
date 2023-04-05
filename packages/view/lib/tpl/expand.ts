import { TemplateIterator } from './iterator';
import { isIterable } from './utils';

export function texpand<T = any>(
  template: JSX.Template<T>,
  map: (x: T) => JSX.Template<T>
): JSX.MaybePromise<void> {
  return traverse([template]);
  // const stack: JSX.Template<T>[] = [template];
  function traverse(
    stack: JSX.Template<T | TemplateIterator<T>>[]
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
      } else if (curr instanceof TemplateIterator) {
        const next = curr.iter.next();
        if (!next.done) {
          stack.push(curr);
        }
        stack.push(next.value);
      } else if (isIterable(curr)) {
        stack.push(new TemplateIterator<T>(curr as any));
      } else {
        stack.push(map(curr));
      }
    }
  }
}
