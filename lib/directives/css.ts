import { JsxFactoryOptions } from '../jsx/factory';
import { Template, TemplateType } from '../jsx';

export interface CssProps {
  value: JSX.ClassName;
}

export function Css(
  props: CssProps,
  _: never,
  options?: JsxFactoryOptions
): Template {
  return {
    type: TemplateType.Attribute,
    name: 'class',
    value: props.value,
    options,
  };
}
