declare module JSX {
  type TagNameMap = {
    [P in keyof HTMLElementTagNameMap]: Tag<HTMLElementTagNameMap[P]>;
  } & {
    [P in keyof SVGTagNameMap]: Tag<SVGTagNameMap[P]>;
  };

  type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X
    ? 1
    : 2) extends <T>() => T extends Y ? 1 : 2
    ? A
    : B;

  type AttrValue<T> = T | Promise<T> | State<T>;

  type Tag<TElement, U = string | number | boolean> = {
    [P in OfType<Mutable<TElement>, U>]?: AttrValue<TElement[P]>;
  } & TagEvents<TElement>;

  type Mutable<T> = {
    [P in MutableProps<T>]: T[P];
  };

  type MutableProps<T> = {
    [P in keyof T]-?: IfEquals<
      { [Q in P]: T[P] },
      { -readonly [Q in P]: T[P] },
      P
    >;
  }[keyof T];

  type OfType<T, U> = {
    [P in keyof T]: T[P] extends U | undefined ? P : never;
  }[keyof T];

  type IntrinsicElements = {
    [P in keyof TagNameMap]: TagNameMap[P] &
      ElementChildrenAttribute &
      ElementCustomAttributes;
  };

  interface ElementCustomAttributes {
    class?: ClassInput;
    for?: AttrValue<Value>;
    role?: AttrValue<Value>;
    tabindex?: AttrValue<Value>;
    className?: ClassInput;
    style?: AttrValue<Value>;
  }

  interface ElementChildrenAttribute {
    children?: Sequence<Value | (() => Sequence<Value>)>;
  }

  type Children = ElementChildrenAttribute['children'];
}
