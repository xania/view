import { JsxFactoryOptions } from 'lib/jsx/options';
import { AttributeType, SetAttributeTemplate, TemplateType } from '../jsx';

export interface CssProps {
  value: JSX.ClassName;
}

export function Css(
  props: CssProps,
  _: any,
  opts?: JsxFactoryOptions
): SetAttributeTemplate {
  return {
    type: TemplateType.SetAttribute,
    attr: {
      type: AttributeType.ClassName,
      value: props.value,
      classes: opts?.classes,
    },
  };
}
