import { isSubscription } from '../utils/observable';
import { Disposable, isDisposable } from './disposable';

export function unrender(result: JSX.Sequence<Removable | Disposable>) {
  const stack = [result];

  while (stack.length > 0) {
    const curr = stack.pop() as any;
    if (curr) {
      if (curr instanceof Array) {
        for (const e of curr) stack.push(e);
      } else if (curr instanceof Promise) {
        curr.then(unrender);
      } else if (curr instanceof Function) {
        curr();
      } else if (isDisposable(curr)) {
        curr.dispose();
      } else if (isSubscription(curr)) {
        curr.unsubscribe();
      }
    }
  }
}

interface Removable {
  remove(): any;
}
