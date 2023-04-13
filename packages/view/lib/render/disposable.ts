export class Disposable {
  constructor(public dispose: () => any) {}
}

export function isDisposable(value: any): value is Disposable {
  return (
    value !== null &&
    value !== undefined &&
    value['dispose'] instanceof Function
  );
}
