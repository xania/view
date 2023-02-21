import { JsxFactoryOptions } from './factory';

export enum TemplateType {
  Attribute = 9384756781,
  Init = 9384756782,
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

// type Primitive = string | number | boolean | Date;

export type Template = AttributeTemplate | InitTemplate;

export function isTemplate(value: any): value is Template {
  return (
    value &&
    (value.type === TemplateType.Attribute || value.type === TemplateType.Init)
  );
}
