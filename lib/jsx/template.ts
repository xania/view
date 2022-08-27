import { Disposable } from '../disposable';
import { Expression } from './expression';
import { Renderable } from './renderable';
import { State } from '../state';

export enum TemplateType {
  Text,
  Tag,
  State,
  Disposable,
  DOM,
  Renderable,
  ViewProvider,
  Expression,
  Fragment,
}

export enum AttributeType {
  Attribute,
  Event,
  ClassName,
}

// type Primitive = string | number | boolean | Date;

export interface TagTemplate {
  type: TemplateType.Tag;
  name: string;
  attrs: (AttributeTemplate | EventTemplate | ClassNameTemplate)[] | null;
  children: unknown[];
}

export interface AttributeTemplate {
  type: AttributeType.Attribute;
  name: string;
  value: Exclude<any, null>;
}
export interface ClassNameTemplate {
  type: AttributeType.ClassName;
  value: Exclude<any, null>;
}
export interface EventTemplate {
  type: AttributeType.Event;
  event: string;
  handler: Function;
}

interface StateTemplate {
  type: TemplateType.State;
  state: State<any>;
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

interface ViewProviderTemplate {
  type: TemplateType.ViewProvider;
  provider: { view: any };
}

export interface RenderableTemplate {
  type: TemplateType.Renderable;
  renderer: Renderable;
}

export interface FragmentTemplate {
  type: TemplateType.Fragment;
  children: unknown[];
}

export interface TextTemplate {
  type: TemplateType.Text;
  value: any;
}

export type Template =
  | TagTemplate
  | StateTemplate
  | DisposableTemplate
  | DomTemplate
  | RenderableTemplate
  | ExpressionTemplate
  | FragmentTemplate
  | TextTemplate
  | ViewProviderTemplate;
