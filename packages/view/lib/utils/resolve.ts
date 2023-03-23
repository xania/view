export function resolve<T, U>(
  value: JSX.MaybePromise<T>,
  resolve: (resolved: T) => U
) {
  if (value instanceof Promise) {
    return value.then(resolve);
  }
  return resolve(value);
}
