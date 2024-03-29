﻿declare namespace JSX {
  type Filter<T> = Pick<
    T,
    {
      [P in keyof T]: T[P] extends never ? never : P;
    }[keyof T]
  >;

  type DependentType<T> = Filter<{
    key: 'key' extends keyof T ? T['key'] : never;
  }>;

  type EventContext<TEvent = Event, TElement = Element> = EventContextProps<
    TElement,
    TEvent
  > &
    DependentType<TEvent>;

  type EventContextProps<TElement, TEvent> = {
    currentTarget: TElement;
    target: EventTarget & Element;
    type: Event['type'];
    event: TEvent & {
      target: EventTarget & Element;
    };
  };

  type TagEvents<TElement> = {
    [E in keyof HTMLElementEventMap]?: MaybeArray<EventHandler<E, TElement>>;
  };

  type Command = import('../../lib/reactivity').Command;

  type EventHandler<
    E extends keyof HTMLElementEventMap = any,
    TElement = any
  > =
    | EventHandlerFn<E, TElement>
    | EventHandlerObj<E, TElement>
    | Command
    | CallableObj<E, TElement>;

  type EventHandlerObj<E extends keyof HTMLElementEventMap, TElement> = {
    handleEvent: EventHandlerFn<E, TElement>;
  };

  type CallableObj<E extends keyof HTMLElementEventMap, TElement> = {
    call: EventHandlerFn<E, TElement>;
  };

  type EventHandlerFn<E extends keyof HTMLElementEventMap, TElement> = (
    e: EventContext<HTMLElementEventMap[E], TElement>
  ) => Sequence<Command | void>;
}
