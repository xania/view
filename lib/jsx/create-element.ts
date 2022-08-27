import { AttributeType, TagTemplate, Template, TemplateType } from './template';

export function createElement(
  name: string | Function | null,
  props: any = null,
  ...children: unknown[]
): Template | null {
  if (name === null /* fragment */) {
    return {
      type: TemplateType.Fragment,
      children,
    };
  }

  if (typeof name === 'string') {
    const attrs = attributes(props);
    return {
      type: TemplateType.Tag,
      name,
      attrs,
      children: children,
    };
  }

  if (typeof name === 'function') {
    try {
      return name(props, children);
    } catch (e) {
      return Reflect.construct(name, [props, children]);
    }
  }

  return null;
}

function attributes(props: any | null): TagTemplate['attrs'] {
  if (props)
    return Object.keys(props).map((name) => {
      const value = props[name];
      if (('on' + name).toLocaleLowerCase() in HTMLElement.prototype) {
        return {
          type: AttributeType.Event,
          event: name.toLocaleLowerCase(),
          handler: value,
        };
      } else if (name === 'class' || name === 'className') {
        return {
          type: AttributeType.ClassName,
          value,
        };
      } else {
        return {
          type: AttributeType.Attribute,
          name,
          value,
        };
      }
    });
  return null;
}
