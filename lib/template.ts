import { Expression } from './expression';

export interface Disposable {
  dispose(): void;
}

export interface Removable {
  remove(): void;
}

export enum TemplateType {
  Text,
  Tag,
  Subscribable,
  Disposable,
  DOM,
  Renderable,
  Context,
  Expression,
  Fragment,
}

export enum AttributeType {
  Attribute,
  Event,
}

// type Primitive = string | number | boolean | Date;

export interface TagTemplate {
  type: TemplateType.Tag;
  name: string;
  attrs: (AttributeTemplate | EventTemplate)[] | null;
  children: Template[];
}

export interface AttributeTemplate {
  type: AttributeType.Attribute;
  name: string;
  value: Exclude<any, null>;
}
export interface EventTemplate {
  type: AttributeType.Event;
  event: string;
  handler: Function;
}
interface NativeTemplate {
  type: TemplateType.Text;
  value: string;
}
interface SubscribableTemplate {
  type: TemplateType.Subscribable;
  value: RXJS.Subscribable<any>;
}
interface DisposableTemplate extends Disposable {
  type: TemplateType.Disposable;
}

interface DomTemplate {
  type: TemplateType.DOM;
  node: Node;
}

interface ContextTemplate {
  type: TemplateType.Context;
  func: (context: any) => any;
}

export interface ExpressionTemplate {
  type: TemplateType.Expression;
  expression: Expression;
}

type RenderResultItem = RXJS.Unsubscribable | Disposable;
export class RenderResult {
  // readonly items: RenderResultItem[] = [];
  readonly nodes: Node[] = [];

  constructor(public values: any) {}

  static create(
    node: Node | null,
    ...results: (RenderResultItem | null | undefined | void)[]
  ) {
    var result = new RenderResult(null);
    const { nodes } = result;

    for (const x of results) {
      if (x) {
        // items.push(x);
      }
    }

    if (node) nodes.push(node);

    return result;
  }

  dispose() {
    const { nodes } = this;
    // for (const item of items) {
    //   if ('dispose' in item) item.dispose();
    //   if ('unsubscribe' in item) item.unsubscribe();
    // }

    for (const elt of nodes) {
      (elt as any).remove();
    }

    //    items.length = 0;
  }
}

export interface RenderContext {
  values: any;
  remove(): unknown;
}
export interface Renderable {
  render(target: Element, context?: RenderContext): RenderResult | void;
}
export interface RenderableTemplate {
  type: TemplateType.Renderable;
  renderer: Renderable;
}

export interface FragmentTemplate {
  type: TemplateType.Fragment;
  children: Template[];
}

export type Template =
  | TagTemplate
  | NativeTemplate
  | SubscribableTemplate
  | DisposableTemplate
  | DomTemplate
  | ContextTemplate
  | RenderableTemplate
  | ExpressionTemplate
  | FragmentTemplate;
