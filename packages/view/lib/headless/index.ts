import { AttrDescriptor, DomDescriptorType } from '../intrinsic';

export function Attrs<TElement = Element>(
  props: JSX.Tag<TElement> & JSX.ElementCustomAttributes
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
