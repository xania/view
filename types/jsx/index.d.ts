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

type TagNameMap = {
  [k in keyof HTMLElementTagNameMap]: HTMLElementTagNameMap[k];
};

type ddd = HTMLElementTagNameMap['input']['checked'];

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

  type ClassNamePrimitive = string | string | [];
  type ClassName =
    | ClassNamePrimitive
    | Subscribable<ClassNamePrimitive>
    | Promise<ClassNamePrimitive>
    | Expression<
        any,
        | ClassNamePrimitive
        | Promise<ClassNamePrimitive>
        | Subscribable<ClassNamePrimitive>
      >;

  type ContextFunction<T, U = any> = (
    t: T,
    context?: { index: number; node: Node }
  ) => U | null | Subscribable<U> | Promise<U>;

  type IntrinsicElement<P extends keyof TagNameMap> = EventMap & {
    [K in Attributes<TagNameMap[P], string>]?: AttrValue<any>;
  } & {
    [K in Attributes<TagNameMap[P], number>]?: AttrValue<number>;
  } & {
    [K in Attributes<TagNameMap[P], boolean>]?: AttrValue<boolean>;
  } & { class?: ClassName | ClassName[]; style?: any; role?: string };

  type dddd = IntrinsicElement<'input'>['checked'];

  type AttrValue<T> =
    | T
    | null
    | ExpressionTemplate<any, T>
    | Expression<any, T>;

  type Attributes<T, U> = {
    [P in keyof T]: T[P] extends U ? P : never;
  }[keyof T];

  interface ExpressionTemplate<T, U> {
    type: number;
    expression: Expression<T, U>;
  }

  interface EventContext<TEvent> {
    node: any;
    index: number;
    event: TEvent;
    values: any;
    context: any;
  }

  export enum ExpressionType {
    Property = 1,
    Function = 2,
    State = 3,
    Promise = 4,
  }

  export interface PropertyExpression {
    type: ExpressionType.Property;
    name: string | number | symbol;
  }

  export interface FunctionExpression<T, U = string> {
    type: ExpressionType.Function;
    func: ContextFunction<T, U>;
    deps: (string | number | symbol)[];
  }

  export interface StateExpression {
    type: ExpressionType.State;
    state: Subscribable<any>;
  }

  export type Expression<T = any, U = any> =
    | PropertyExpression
    | FunctionExpression<T, U>
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
