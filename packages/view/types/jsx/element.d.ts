declare module JSX {
  type DomDescriptor = import('../../lib/intrinsic/descriptors').DomDescriptor;
  type Viewable = import('../../lib/render/viewable').Viewable;
  type Attachable = import('../../lib/render/attachable').Attachable;
  type Program = import('../../lib/compile/program').Program;
  type IfExpression = import('../../lib').IfExpression;
  type ListExpression = import('../../lib').ListExpression;
  type Command = import('../../lib').Command;
  type UpdateFunction = import('../../lib').UpdateFunction;
  type Disposable = { dispose(): any };

  type Primitive = string | number;

  interface Stateful<T = any> {
    initial?: MaybePromise<T>;
  }

  type Value =
    | Primitive
    | Stateful<Primitive>
    | DomDescriptor
    | Program
    | Viewable
    | Attachable
    | IfExpression
    | ListExpression
    | Disposable
    | Command;

  /**
   * True type of an element is the <code>TagDescriptor</code> not JSX>Element,
   * type Element represents the return type of a Component. In Xania return type can
   * be a variety of different possibilities represented here as follows:
   */
  type Element = Template<Value>;

  type Just<T> = T;
  type Nothing = null | undefined | void;
  type MaybePromise<T> = T | Promise<T>;
  type MaybeArray<T> = T | T[];
  type Template<T> =
    | MaybePromise<Nothing | Just<T> | Template<T>[]>
    | Promise<Template<T>>;
}
