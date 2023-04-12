import { tmap } from './map';

export function tapply<T = any>(
  template: JSX.Sequence<T | ((this: any, ...args: any[]) => T)>,
  args: any[]
): JSX.MaybePromise<JSX.Sequence<T>> {
  return tmap(template, (child) => {
    if (child instanceof Function) {
      return child.apply(null, args);
    } else {
      return child;
    }
  });
}
