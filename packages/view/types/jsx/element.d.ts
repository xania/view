declare module JSX {
  type DomDescriptor = import('../../lib/intrinsic/descriptors').DomDescriptor;
  type Viewable = import('../../lib/render/viewable').Viewable;
  type Attachable = import('../../lib/render/attachable').Attachable;
  type Program = import('../../lib/compile/program').Program;

  type Primitive = string | number;

  interface Stateful<T = any> {
    initial?: T;
  }

  type Value =
    | Primitive
    | Stateful<Primitive>
    | DomDescriptor
    | Program
    | Viewable
    | Attachable;
  type Just<T> = T;
  type Nothing = null | undefined | void;

  /**
   * True type of an element is the <code>TagDescriptor</code> not JSX>Element,
   * type Element represents the return type of a Component. In Xania return type can
   * be a variety of different possibilities represented here as follows:
   */
  type Element = MaybePromise<Nothing | Just<Value> | Element[]>;
  type MaybePromise<T> = T | Promise<T>;
  type MaybeArray<T> = T | T[];
}
