import { Rx } from '../rx';

export interface SubscribeSource {}
export function subscribe<T, O extends Rx.NextObserver<T>>(
  this: Rx.Subscribable<T>,
  observer: O
): Rx.Subscription {
  const value = this;

  // const { snapshot } = value;

  // if (snapshot !== undefined) {
  //   observer.next(snapshot);
  // }

  let { observers } = value;
  if (observers) {
    observers.push(observer);
  } else {
    this.observers = observers = [observer];
  }

  return {
    unsubscribe() {
      const { observers } = value;
      if (observers) {
        const idx = observers.indexOf(observer);
        observers?.splice(idx, 1);
      }
    },
  };
}
