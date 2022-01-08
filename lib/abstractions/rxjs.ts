export interface NextObserver<T> {
  next: (value: T) => void;
  error?: (err: any) => void;
  complete?: () => void;
}

export interface Unsubscribable {
  unsubscribe(): void;
}

export interface Subscribable<T> {
  subscribe(observer: NextObserver<T>): Unsubscribable;
}

export interface Observer<T> {
  next: (value: T) => void;
  error: (err: any) => void;
  complete: () => void;
}

export function isSubscribable(value: any): value is Subscribable<unknown> {
  return value && typeof value.subscribe === 'function';
}

export function isUnsubscribable(value: any): value is Unsubscribable {
  return value && typeof value.unsubscribe === 'function';
}
