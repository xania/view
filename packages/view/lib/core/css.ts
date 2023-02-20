import { JsxFactoryOptions } from '../jsx/factory';
import { Template, TemplateType } from '../jsx';

export interface CssProps {
  value: JSX.ClassInput;
}

export function Css(props: CssProps, options?: JsxFactoryOptions): Template {
  return {
    type: TemplateType.Attribute,
    name: 'class',
    value: props.value,
    options,
  };
}
