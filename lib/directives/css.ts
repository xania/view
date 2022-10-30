import { AttributeType, SetAttributeTemplate, TemplateType } from '../jsx';

export interface CssProps {
  value: JSX.ClassName;
}

export function Css(props: CssProps): SetAttributeTemplate {
  return {
    type: TemplateType.SetAttribute,
    attr: {
      type: AttributeType.ClassName,
      value: props.value,
    },
  };
}
