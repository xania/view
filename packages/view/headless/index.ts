import { AttrDescriptor, DomDescriptor, DomDescriptorType } from '../lib';

export function Attrs(
  props: JSX.Tag<Element> & JSX.ElementCustomAttributes
): AttrDescriptor[] {
  const attrs: AttrDescriptor[] = [];
  for (const attrName in props) {
    const attrValue = (props as any)[attrName];
    if (attrValue !== null && attrValue !== undefined) {
      attrs.push({
        type: DomDescriptorType.Attribute,
        name: attrName,
        value: attrValue,
      });
    }
  }

  return attrs;
}
