interface Promise<T> {
  /**
   * just by redefining `then` from Promise interface where we simplify type definitions,
   * this greatly simplifies e.g. render method and resolves / eliminate many weird typescript
   * errors
   */
  then<U>(resolve: (x: T) => U | Promise<U>): Promise<U>;
}

declare module JSX {
  type DomDescriptor = import('../../lib/intrinsic/descriptors').DomDescriptor;
  type Viewable = import('../../lib/render/viewable').Viewable;
  type Attachable = import('../../lib/render/attachable').Attachable;
  type Program = import('../../lib/compile/program').Program;
  type IfExpression = import('../../lib').IfExpression;
  type ListExpression = import('../../lib').ListExpression;
  type Command = import('../../lib').Command;
  type UpdateFunction = import('../../lib').UpdateFunction;
  type Component = import('../../lib').Component;
  type StateEffect<T> = import('../../lib').StateEffect<T>;
  type Disposable = { dispose(): any };

  type Primitive = string | number;

  interface State<T = any> {
    initial?: JSX.MaybePromise<T | undefined>;
  }

  type Value =
    | Primitive
    | State<Primitive>
    | StateEffect<T>
    | DomDescriptor
    | Program
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
  type Element = Template<Value>;

  type Just<T> = T;
  type Nothing = null | undefined | void;
  // type Future<T> = Promise<T>; // | Promise<Future<T>>;
  type MaybePromise<T> = T | Promise<T>;
  type MaybeArray<T> = T | T[];
  type Template<T> =
    | Nothing
    | Just<T>
    | Template<T>[]
    | Promise<Template<T>>
    | (() => Template<T>);
}
