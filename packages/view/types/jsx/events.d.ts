declare module JSX {
  type EventContext<TData, TEvent, TElement> =
    import('../../lib/jsx/element').EventContext<TData, TEvent, TElement>;

  type TagEvents<TElement, TData> = {
    [E in keyof HTMLElementEventMap]?: (
      e: EventContext<TData, HTMLElementEventMap[E], TElement>
    ) => void;
  };
}
