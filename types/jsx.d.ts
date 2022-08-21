declare module JSX {
  type IntrinsicElements = {
    [P in keyof HTMLElementTagNameMap]: IntrinsicElement<P>;
  } & {
    label: {
      for?: string | number;
    };
    style: any;
  };

  type Element = any;

  type EventMap = {
    [P in keyof HTMLElementEventMap]?: (
      e: EventContext<HTMLElementEventMap[P]>
    ) => void;
  };

  type IntrinsicElement<P extends keyof HTMLElementTagNameMap> = EventMap & {
    [K in Attributes<HTMLElementTagNameMap[P], string>]?: AttrValue<any>;
  } & {
    [K in Attributes<HTMLElementTagNameMap[P], number>]?: AttrValue<number>;
  } & { class?: any; style?: any };

  type AttrValue<T> = T | null | ExpressionTemplate;

  type Attributes<T, U> = {
    [P in keyof T]: T[P] extends U ? P : never;
  }[keyof T];

  interface ExpressionTemplate {
    type: number;
  }

  interface EventContext<TEvent> {
    node: Node;
    index: number;
    event: TEvent;
    values: any;
    context: any;
  }
}
