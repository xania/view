interface Promise<T> {
  /**
   * just by redefining `then` from Promise interface where we simplify
   * it's type definitions, it greatly simplifies e.g. render method and
   * resolves many weird typescript errors
   */
  then<U>(resolve: (x: T) => U | Promise<U>): Promise<U>;
}

declare module JSX {
  type DomDescriptor = import('../../lib/intrinsic/descriptors').DomDescriptor;
  type Viewable = import('../../lib/render/viewable').Viewable;
  type Attachable = import('../../lib/render/attachable').Attachable;
  type Program = import('../../lib/compile/program').Program;
  // type IfExpression = import('../../lib').IfExpression;
  type ListExpression = import('../../lib/reactivity').ListExpression;
  type Command = import('../../lib/reactivity').Command;
  type State<T> = import('../../lib/reactivity').State;
  type UpdateFunction = import('../../lib').UpdateFunction;
  type Component = import('../../lib').Component;
  type Disposable = { dispose(): any };

  type Primitive = string | number;

  type Value =
    | Primitive
    | State<Primitive>
    //  | StateEffect<T>
    | DomDescriptor
    | Viewable
    | Attachable
    | IfExpression
    | ListExpression
    | Disposable
    | Command
    | Component;

  /**
   * True type of an element is the <code>TagDescriptor</code> not JSX>Element,
   * type Element represents the return type of a Component. In Xania return type can
   * be a variety of different possibilities represented here as follows:
   */
  type Element = Sequence<Value>;

  type Just<T> = T;
  type Nothing = null | undefined;
  // type Future<T> = Promise<T>; // | Promise<Future<T>>;
  type MaybePromise<T> = T | Promise<T>;
  type MaybeArray<T> = T | T[];
  type Sequence<T = any> =
    | Nothing
    | Just<T>
    | Sequence<T>[]
    | Generator<Sequence<T>>
    | Promise<Sequence<T>>
    | Iterable<T>;
}
