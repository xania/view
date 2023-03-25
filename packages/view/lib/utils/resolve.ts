export function resolve<T, U>(
  value: JSX.MaybePromise<T>,
  resolve: (resolved: T) => JSX.MaybePromise<U>
) {
  if (value instanceof Promise) {
    return value.then(resolve);
  }
  return resolve(value);
}
