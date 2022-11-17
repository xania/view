import { Disposable } from '../disposable';
import { Renderable } from './renderable';
import { State } from '../state';
import { Subscribable } from '../util/is-subscibable';

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
  AttachTo,
  SetAttribute,
  Subscribable,
  Promise,
}

export interface SubscribableTemplate {
  type: TemplateType.Subscribable;
  value: Subscribable;
}
export interface PromiseTemplate {
  type: TemplateType.Promise;
  value: Promise<any>;
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

export interface SetAttributeTemplate {
  type: TemplateType.SetAttribute;
  attr: AttributeTemplate | EventTemplate | ClassNameTemplate;
}

export interface AttributeTemplate {
  type: AttributeType.Attribute;
  name: string;
  value: Exclude<any, null>;
}

export interface ClassNameTemplate {
  type: AttributeType.ClassName;
  value: JSX.ClassName;
  classes?: { [k: string]: string };
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

export interface ExpressionTemplate<T> {
  type: TemplateType.Expression;
  expression: JSX.Expression<T>;
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

export interface AttachTemplate {
  type: TemplateType.AttachTo;
  attachable: {
    attachTo(dom: HTMLElement): unknown;
  };
}

export type Template<T = unknown> =
  | TagTemplate
  | StateTemplate
  | DisposableTemplate
  | DomTemplate
  | RenderableTemplate
  | ExpressionTemplate<T>
  | FragmentTemplate
  | TextTemplate
  | ViewProviderTemplate
  | AttachTemplate
  | SetAttributeTemplate
  | SubscribableTemplate
  | PromiseTemplate;

export function isExpressionTemplate(
  value: any
): value is ExpressionTemplate<any> {
  return value && value.type === TemplateType.Expression;
}
