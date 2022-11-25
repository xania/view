import { Renderable } from '../jsx/renderable';
import { ExpressionTemplate, TagTemplate } from '../jsx/template';
import { Subscribable } from '../util/is-subscibable';

export type TemplateInput<T = any> =
  | TagTemplate
  | ExpressionTemplate<any, T>
  | Renderable
  | Promise<TemplateInput<T>>
  | Subscribable<TemplateInput<T>>
  | { toString(): string };
