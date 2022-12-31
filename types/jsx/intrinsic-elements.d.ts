declare module JSX {
  type TagNameMap = {
    [P in keyof HTMLElementTagNameMap]: Tag<HTMLElementTagNameMap[P]>;
  };

  type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X
    ? 1
    : 2) extends <T>() => T extends Y ? 1 : 2
    ? A
    : B;

  type AttrValue<T> = T | Promise<T> | Observable<T>;

  type Tag<T, U = string | number> = {
    [P in OfType<Mutable<T>, U>]?: AttrValue<U>;
  } & TagEvents;

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
    [P in keyof T]: T[P] extends U ? P : never;
  }[keyof T];

  // HTMLElementTagNameMap

  type IntrinsicElements = {
    [P in keyof TagNameMap]: TagNameMap[P] &
      ElementChildrenAttribute &
      ClassAttribute;
    // div: E<{ class?: string }>;
    // header: E<{ class: string }>;
    // button: E<{ class: string; click: Function }>;
    // span: E<{ class: string }>;
    // p: E<{ class: string }>;
  };

  interface ClassAttribute {
    class?: ClassName;
    className?: ClassName;
  }

  interface ElementChildrenAttribute {
    children?: Element | Element[];
  }
}
