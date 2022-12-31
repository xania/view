declare module JSX {
  export interface Observable<T = any> {
    subscribe<O extends NextObserver<T>>(observer: O): Unsubscribable;
  }

  export interface NextObserver<T> {
    next: (value: T) => void;
    error?: (err: any) => void;
    complete?: () => void;
  }

  export interface Unsubscribable {
    unsubscribe(): void;
  }
}
