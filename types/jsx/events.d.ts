declare module JSX {
  type EventContext<T, E> = import('../../lib/jsx/element').EventContext<T, E>;

  type TagEvents<T = any> = {
    [E in keyof HTMLElementEventMap]?: (
      e: EventContext<T, HTMLElementEventMap[E]>
    ) => void;
  };
}
