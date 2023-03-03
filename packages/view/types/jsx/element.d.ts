declare module JSX {
  type Observable<T> = import('../../lib/jsx/observables').Observable<T>;
  type Renderable<T> = import('../../lib/jsx/renderable').Renderable<T>;
  type Attachable = import('../../lib/jsx/renderable').Attachable;
  type TemplateNode = import('../../lib/jsx/template-node').TemplateNode;
  type Template = import('../../lib/jsx/template').Template;

  type Value<T = any> =
    | null
    | undefined
    | void
    | string
    | number
    | boolean
    | bigint
    | Stringable
    | Expression<T>;

  type ElementNode = Value | Renderable<any> | Node | Lazy<any> | Attachable;

  type Stringable = { [Symbol.toStringTag](): string };

  type Element =
    | ElementNode
    | Observable<ElementNode>
    | Promise<ElementNode>
    | TemplateNode
    | Template;
}
