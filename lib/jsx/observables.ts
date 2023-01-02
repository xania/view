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

export function isSubscribable(value: any): value is Observable<any> {
  return value && value.subscribe instanceof Function;
}

export function isNextObserver(value: any): value is NextObserver<any> {
  return value && value.next instanceof Function;
}

export function isUnsubscribable(value: any): value is Unsubscribable {
  return value && value.unsubscribe instanceof Function;
}

// export interface Observer<T> {
//   next: (value: T) => void;
//   error: (err: any) => void;
//   complete: () => void;
// }
