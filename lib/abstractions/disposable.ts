export interface Disposable {
  dispose(): void;
}

export interface Removable {
  remove(): void;
}

export function isDisposable(value: any): value is Disposable {
  return value && value['dispose'] instanceof Function;
}
