import { _observers } from './symbols';

export function notify<T>(observable: any, state: T) {
  const observers = observable[_observers];
  if (observers) {
    let length = observers.length;
    while (length--) {
      const o = observers[length];
      o.next(state);
    }
  }
}
