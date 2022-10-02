interface SVGTagNameMap {
  svg: {
    xmlns: string;
    width: number;
    height: number;
  };
  g: {
    fill: string;
    'fill-rule': string;
  };
  path: {
    d: string;
    fill: string;
    'fill-rule': string;
  };
}

declare module JSX {
  type TagNameMap = HTMLElementTagNameMap & SVGTagNameMap;

  type IntrinsicElements = {
    [P in keyof TagNameMap]: IntrinsicElement<P>;
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

  type IntrinsicElement<P extends keyof TagNameMap> = EventMap & {
    [K in Attributes<TagNameMap[P], string>]?: AttrValue<any>;
  } & {
    [K in Attributes<TagNameMap[P], number>]?: AttrValue<number>;
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
