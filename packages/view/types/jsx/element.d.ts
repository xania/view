interface Promise<T> {
  /**
   * just by redefining `then` from Promise interface where we simplify
   * it's type definitions, it greatly simplifies e.g. render method and
   * resolves many weird typescript errors
   */
  then<U>(resolve: (x: T) => U | Promise<U>): Promise<U>;
}

declare namespace JSX {
  type DomDescriptor = import('../../lib/intrinsic/descriptors').DomDescriptor;
  type Viewable = import('../../lib/render/viewable').Viewable;
  type Attachable = import('../../lib/render/attachable').Attachable;
  type Program = import('../../lib/compile/program').Program;
  type IfExpression = import('../../lib/reactivity').IfExpression;
  type ListExpression = import('../../lib/reactivity').ListExpression;
  type Command = import('../../lib/reactivity').Command;
  type Reactive<T> = import('../../lib/reactivity').Reactive;
  type UpdateFunction = import('../../lib').UpdateFunction;
  type Component = import('../../lib').Component;
  type Transformer<T> = import('../../lib').Transformer<T>;
  type Disposable = { dispose(): any };

  type Primitive = string | number;

  type Value =
    | Primitive
    | Reactive<Primitive>
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
  type Element = any;

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
    | Iterable<T>
    | (() => Sequence<T>)
    | Transformer<T>;
}
