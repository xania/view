import { AttributeType, SetAttributeTemplate, TemplateType } from '../jsx';

export interface AttrsProps {
  [name: string]: string;
}
export function Attrs(props: AttrsProps) {
  const result: SetAttributeTemplate[] = [];
  for (const k in props) {
    result.push({
      type: TemplateType.SetAttribute,
      attr: {
        name: k,
        type: AttributeType.Attribute,
        value: props[k],
      },
    });
  }
  return result;
}
