// import { AttributeType, SetAttributeTemplate, TemplateType } from '../jsx';

import { Template, TemplateType } from '../jsx';

export interface AttrsProps {
  [name: string]: string;
}
export function Attrs(props: AttrsProps, _: never) {
  const result: Template[] = [];
  for (const k in props) {
    result.push({
      type: TemplateType.Attribute,
      name: k,
      value: props[k],
    });
  }
  return result;
}
