declare module JSX {
  type TagEvents<T = any> = {
    [E in keyof HTMLElementEventMap]?: (
      e: EventContext<T, HTMLElementEventMap[E]>
    ) => void;
  };

  interface EventContext<T, TEvent = any> extends ViewContext<T> {
    event: TEvent;
  }

  export interface ViewContext<T> {
    readonly node: any;
    readonly data: T;
  }
}
