/// <reference path="./class-name.d.ts" />
/// <reference path="./element.d.ts" />
/// <reference path="./intrinsic-elements.d.ts" />
/// <reference path="./svg.d.ts" />
/// <reference path="./events.d.ts" />

declare module JSX {
  type EventMap<T> = {
    [P in keyof HTMLElementEventMap]?: (
      e: EventContext<T, HTMLElementEventMap[P]>
    ) => void;
  };

  type Updater<T> = (t: T) => void | T;
}

type Func<T> = () => T;
type NestedArray<T> = T | [NestedArray<T>];
