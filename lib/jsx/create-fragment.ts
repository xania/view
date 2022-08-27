import { Template, TemplateType } from './template';

export function createFragment(_: null, children: Template[]): Template {
  return {
    type: TemplateType.Fragment,
    children,
  };
}
