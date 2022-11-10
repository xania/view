interface SVGTagNameMap {
  svg: {
    xmlns: string;
    width: number;
    height: number;
    fill: string;
    viewBox: string;
    stroke: string;
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
  type TagNameMap = HTMLElementTagNameMap &
    SVGTagNameMap & {
      div: {
        role: string;
      };
      a: {
        role: string;
      };
    };

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

  type ClassName =
    | string
    | Subscribable<string | string[]>
    | ExpressionTemplate<any>;

  type IntrinsicElement<P extends keyof TagNameMap> = EventMap & {
    [K in Attributes<TagNameMap[P], string>]?: AttrValue<any>;
  } & {
    [K in Attributes<TagNameMap[P], number>]?: AttrValue<number>;
  } & { class?: ClassName | ClassName[]; style?: any; role?: string };

  type AttrValue<T> = T | null | ExpressionTemplate<T>;

  type Attributes<T, U> = {
    [P in keyof T]: T[P] extends U ? P : never;
  }[keyof T];

  interface ExpressionTemplate<T> {
    type: number;
    expression: Expression<T>;
  }

  interface EventContext<TEvent> {
    node: Node;
    index: number;
    event: TEvent;
    values: any;
    context: any;
  }

  export enum ExpressionType {
    Property = 1,
    Function = 2,
    State = 3,
  }

  export interface PropertyExpression {
    type: ExpressionType.Property;
    name: string | number | symbol;
  }

  export interface FunctionExpression<T> {
    type: ExpressionType.Function;
    func: (
      t: T,
      context?: { index: number; node: Node }
    ) => string | undefined | void;
    deps: (string | number | symbol)[];
  }

  export interface StateExpression {
    type: ExpressionType.State;
    state: Subscribable<any>;
  }

  export type Expression<T> =
    | PropertyExpression
    | FunctionExpression<T>
    | StateExpression;

  export interface NextObserver<T> {
    next: (value: T, prev?: T) => void;
    error?: (err: any) => void;
    complete?: () => void;
  }

  export interface Unsubscribable {
    unsubscribe(): void;
  }

  export interface Subscribable<T> {
    subscribe<O extends NextObserver<T>>(observer: O): Unsubscribable;
  }

  export interface Observer<T> {
    next: (value: T) => void;
    error: (err: any) => void;
    complete: () => void;
  }
}
