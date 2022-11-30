import { JsxFactoryOptions } from './options';

export enum TemplateType {
  Attribute,
  Init,
  Expression,
}

export interface AttributeTemplate {
  type: TemplateType.Attribute;
  name: string;
  value: any;
  options?: JsxFactoryOptions;
}
export interface InitTemplate {
  type: TemplateType.Init;
  init: Function;
}
export interface ExpressionTemplate {
  type: TemplateType.Expression;
  expr: JSX.Expression;
}

// type Primitive = string | number | boolean | Date;

export type Template = AttributeTemplate | InitTemplate | ExpressionTemplate;

export function isTemplate(value: any): value is Template {
  return (
    value &&
    (value.type === TemplateType.Expression ||
      value.type === TemplateType.Attribute ||
      value.type === TemplateType.Init)
  );
}
