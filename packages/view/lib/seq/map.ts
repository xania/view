﻿import { isIterable } from '../utils/iterator';

export function smap<T = any, U = any>(
  template: JSX.Sequence<T>,
  map: (x: T, ...args: any[]) => U,
  ...args: any[]
): JSX.Sequence<U> {
  const retval: JSX.Sequence<U | Function>[] = [];
  const stack: any[] = [template];
  while (stack.length) {
    const curr = stack.pop()!;

    if (curr === null || curr === undefined) {
      // ignore
    } else if (curr instanceof Array) {
      for (let i = curr.length - 1; i >= 0; i--) {
        stack.push(curr[i]);
      }
    } else if (curr instanceof Promise) {
      retval.push(
        curr.then((resolved) => smap(resolved, map)) as JSX.Sequence<U>
      );
    } else if (curr instanceof Function) {
      stack.push(curr(...args));
    } else if (curr instanceof TemplateIterator) {
      // console.log(curr);
    } else if (isIterable(curr)) {
      // console.log('async iter', curr);
      const iter = curr[Symbol.iterator]();
      stack.push(new TemplateIterator(iter));
      throw Error('not yet implemented');
    } else {
      retval.push(map(curr));
    }
  }

  return retval as any;
}

class TemplateIterator<T = any> {
  constructor(public iter: Iterator<T>) {}
}
