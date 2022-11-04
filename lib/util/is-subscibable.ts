export function isSubscribable(value: any): value is Subscribable<unknown> {
  return value && value.subscribe instanceof Function;
}

export function isUnsubscribable(value: any): value is Unsubscribable {
  return value && value.unsubscribe instanceof Function;
}

export interface NextObserver<T> {
  next: (value: T) => void;
  error?: (err: any) => void;
  complete?: () => void;
}

export interface Unsubscribable {
  unsubscribe(): void;
}

export interface Subscribable<T = any> {
  subscribe(observer: NextObserver<T>): Unsubscribable;
}

export interface Observer<T> {
  next: (value: T) => void;
  error: (err: any) => void;
  complete: () => void;
}
