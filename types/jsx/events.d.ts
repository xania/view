declare module JSX {
  type EventContext<T, E> = import('../../lib/jsx/element').EventContext<T, E>;
  type NextObserver<T> = import('../../lib/jsx/observables').NextObserver<T>;

  type TagEvents<T = any> = {
    [E in keyof HTMLElementEventMap]?:
      | ((e: EventContext<T, HTMLElementEventMap[E]>) => void)
      | NextObserver<EventContext<T, HTMLElementEventMap[E]>>;
  };
}
