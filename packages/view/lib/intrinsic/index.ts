import {
  DomDescriptor,
  DomDescriptorType,
  AttrDescriptor,
} from './descriptors';
import { isEventKey } from './event-keys';

export function intrinsic(
  name: string,
  props: { children?: JSX.Element; [attr: string]: any }
) {
  const template: DomDescriptor = {
    name,
    type: DomDescriptorType.Element,
  };

  if (props) {
    const { children, ...attrs } = props;

    if (children) {
      template.children = children;
    }

    for (const attrName in attrs) {
      const attrValue = attrs[attrName];

      if (attrName === 'class' || attrName === 'className') {
        if (attrValue instanceof Array) {
          for (const cl of attrValue) {
            if (cl) {
              if (template.classList) template.classList.push(cl);
              else template.classList = [cl];
            }
          }
        } else if (attrValue) {
          if (template.classList) template.classList.push(attrValue);
          else template.classList = [attrValue];
        }
      } else if (isEventKey(attrName)) {
        const eventHandler: JSX.EventHandler = attrValue;

        const events = template.events;
        if (events) {
          events[attrName] = eventHandler;
        } else {
          template.events = {
            [attrName]: eventHandler,
          };
        }
      } else {
        const attrDef = {
          name: attrName,
          value: attrValue,
        } satisfies AttrDescriptor;
        if (template.attrs) template.attrs.push(attrDef);
        else template.attrs = [attrDef];
      }
    }
  }

  return template;
}

export * from './descriptors';
