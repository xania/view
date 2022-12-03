import { _observers, _previous } from './symbols';

interface State {
  [_observers]?: NextObserver<this>[];
}

interface NextObserver<T> {
  [_previous]: T;
  next(value: T): any;
}

export function subscribe<T extends State, O extends NextObserver<T>>(
  value: T,
  observer: O
) {
  const observers = value[_observers] ?? (value[_observers] = []);
  observers.push(observer);

  observer[_previous] = value;
  observer.next(value);

  return {
    unsubscribe() {
      const idx = observers.indexOf(observer);
      if (idx >= 0) {
        observers.splice(idx, 1);
      }
    },
  };
}
