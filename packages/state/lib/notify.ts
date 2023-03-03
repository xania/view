import { Rx } from './rx';

export function notify<T>(state: Rx.Stateful<T>) {
  const { observers, snapshot } = state;
  if (observers !== undefined)
    for (const obs of observers as any) {
      obs.next(snapshot);
    }
}
