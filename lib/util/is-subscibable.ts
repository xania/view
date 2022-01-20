export function isSubscribable(
  value: any
): value is RXJS.Subscribable<unknown> {
  return value && typeof value.subscribe === 'function';
}

export function isUnsubscribable(value: any): value is RXJS.Unsubscribable {
  return value && typeof value.unsubscribe === 'function';
}
