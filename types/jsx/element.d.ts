declare module JSX {
  type Observable<T> = import('../../lib/jsx/observables').Observable<T>;
  type Renderable<T> = import('../../lib/jsx/renderable').Renderable<T>;
  type TemplateNode = import('../../lib/jsx/template-node').TemplateNode;

  type Value<T = any> =
    | null
    | undefined
    | void
    | string
    | number
    | boolean
    | bigint
    | TemplateNode
    | Stringable
    | Lazy<T>;

  type ElementNode = Value | Renderable<any> | Node;

  type Stringable = { [Symbol.toStringTag](): string };

  type Element =
    | Element[]
    | ElementNode
    | Observable<ElementNode>
    | Promise<ElementNode>;
}
