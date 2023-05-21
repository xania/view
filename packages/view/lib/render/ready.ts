export function ready(result: JSX.Sequence): Promise<any> | void {
  if (result instanceof Array) {
    return Promise.all(result);
  }
  if (result instanceof Promise) {
    return result.then(ready);
  }
}
