export interface NextObserver<T, U = any> {
  next: (value: T, prev?: U) => U;
  error?: (err: any) => void;
  complete?: () => void;
}

export interface Subscribable<T> {
  subscribe<O extends NextObserver<T>>(observer: O): Subscription;
}

export interface Subscription {
  unsubscribe(): void;
}

export function isSubscribable<T>(value: any): value is Subscribable<T> {
  if (value === null || value === undefined) return false;
  return value && value.subscribe instanceof Function;
}

export interface Subscription {
  unsubscribe(): void;
}

export function isSubscription(value: any): value is Subscription {
  if (value === null || value === undefined) return false;
  return value.unsubscribe instanceof Function;
}
