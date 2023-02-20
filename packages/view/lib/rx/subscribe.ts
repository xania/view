import { _observers, _previous } from './symbols';

export interface Observable {
  [_observers]?: NextObserver<this>[];
}

interface NextObserver<T> {
  // [_previous]: T;
  next(value: T): any;
}

export function subscribe<
  T extends Observable & Record<any, any>,
  O extends NextObserver<T>
>(state: T, observer: O) {
  if (state === null || state === undefined || typeof state !== 'object')
    return null;

  const observers = state[_observers] ?? (state[_observers] = []);
  observers.push(observer);

  return {
    unsubscribe() {
      const idx = observers.indexOf(observer);
      if (idx >= 0) {
        observers.splice(idx, 1);
      }
    },
  };
}
