import { AttributeType, TagTemplate, Template, TemplateType } from './template';
import { render } from '../render';
import { RenderTarget } from './renderable';

function renderTemplate(this: Template, container: RenderTarget) {
  return render(this, container);
}

interface TemplateRender {
  render(target: RenderTarget): unknown;
}

export function createFragment(
  _: null,
  children: Template[]
): (Template & TemplateRender) | null {
  if (children instanceof Array && children.length > 0)
    return {
      type: TemplateType.Fragment,
      children,
      render: renderTemplate,
    };
  return null;
}

export function createElement(
  name: string | Function | null,
  props: any = null,
  ...children: unknown[]
): (Template & TemplateRender) | null {
  if (name === null /* fragment */) {
    return {
      type: TemplateType.Fragment,
      children,
      render: renderTemplate,
    };
  }

  if (typeof name === 'string') {
    const attrs = attributes(props);
    return {
      type: TemplateType.Tag,
      name,
      attrs,
      children: children,
      render: renderTemplate,
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
