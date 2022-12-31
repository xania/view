export function isSubscribable(value: any): value is JSX.Observable<any> {
  return value && value.subscribe instanceof Function;
}

export function isNextObserver(value: any): value is JSX.NextObserver<any> {
  return value && value.next instanceof Function;
}

export function isUnsubscribable(value: any): value is JSX.Unsubscribable {
  return value && value.unsubscribe instanceof Function;
}

export interface Observer<T> {
  next: (value: T) => void;
  error: (err: any) => void;
  complete: () => void;
}
