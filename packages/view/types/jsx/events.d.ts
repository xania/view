declare module JSX {
  type EventContext<TData, TEvent, TElement> =
    import('../../lib/jsx/element').EventContext<TData, TEvent, TElement>;
  type NextObserver<T> = import('../../lib/jsx/observables').NextObserver<T>;

  type TagEvents<TElement, TData> = {
    [E in keyof HTMLElementEventMap]?:
      | ((e: EventContext<TData, HTMLElementEventMap[E], TElement>) => void)
      | NextObserver<EventContext<TData, HTMLElementEventMap[E], TElement>>;
  };
}
