import { Disposable } from './abstractions/disposable';
import { Expression } from './expression';
import { Renderable } from './renderable';

export enum TemplateType {
  Text,
  Tag,
  Subscribable,
  Disposable,
  DOM,
  Renderable,
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

export interface ExpressionTemplate {
  type: TemplateType.Expression;
  expression: Expression;
}

export interface RenderableTemplate {
  type: TemplateType.Renderable;
  renderer: Renderable;
}

export interface FragmentTemplate {
  type: TemplateType.Fragment;
  children: Template[];
}

export interface TextTemplate {
  type: TemplateType.Text;
  value: any;
}

export type Template =
  | TagTemplate
  | SubscribableTemplate
  | DisposableTemplate
  | DomTemplate
  | RenderableTemplate
  | ExpressionTemplate
  | FragmentTemplate
  | TextTemplate;
