export interface Subscription {
  unsubscribe(): void;
}

export function isSubscription(value: any): value is Subscription {
  if (value === null || value === undefined) return false;
  return value.unsubscribe instanceof Function;
}
