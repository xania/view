import {
  DomDescriptorType,
  ElementDescriptor,
  StaticTemplate,
} from '../intrinsic/descriptors';
import { RenderContext } from './render-context';
import { DomFactory } from './dom-factory';
import { Disposable } from '../disposable';
import { isAttachable } from './attachable';

export function applyAttributes(
  target: HTMLElement,
  attrs: ElementDescriptor['attrs']
) {
  if (attrs) {
    for (let i = 0, len = attrs.length; i < len; i++) {
      const attr = attrs[i];
      (target as any)[attr.name] = attr.value;
    }
  }
}

export function applyEvents(
  events: ElementDescriptor['events'],
  target: HTMLElement,
  context: RenderContext
) {
  if (!events) {
    return null;
  }

  const disposables: Disposable[] = [];
  for (const eventName in events) {
    const eventHandler = events[eventName];

    const { scope } = context;
    const syntaticEventHandler = (originalEvent: Event) => {
      const changes =
        eventHandler instanceof Function
          ? eventHandler(syntheticEvent(eventName, originalEvent), scope)
          : eventHandler.handleEvent(
              syntheticEvent(eventName, originalEvent),
              scope
            );
      if (changes instanceof Array) {
        for (const state of changes) {
          const { signalBindings } = context;
          for (const binding of signalBindings) {
            if (binding[0] === state) {
              const textNode = binding[1];
              textNode.textContent = scope.get(state);
            }
          }
        }
        // signal.snapshot = newValue;
      }
    };

    disposables.push(
      new Disposable(() => {
        target.removeEventListener(eventName, syntaticEventHandler, true);
      })
    );

    target.addEventListener(eventName, syntaticEventHandler, true);
  }

  return disposables;
}

export function syntheticEvent(
  eventName: string,
  domEvent: Event,
  currentTarget = domEvent.currentTarget
) {
  const syntaticEvent: any = {
    event: domEvent as any,
    target: domEvent.target,
    currentTarget: currentTarget,
    type: eventName,
  };
  if ('key' in domEvent) {
    syntaticEvent.key = domEvent.key;
  }

  return syntaticEvent;
}

export function renderStatic(st: StaticTemplate, domFactory: DomFactory) {
  switch (st.type) {
    case DomDescriptorType.StaticElement:
      const element = domFactory.createElement(st.name);
      applyAttributes(element, st.attrs);

      const { children } = st;
      if (children instanceof Array) {
        for (const child of children) {
          element.appendChild(renderStatic(child, domFactory));
        }
      } else if (children) {
        element.appendChild(renderStatic(children, domFactory));
      }
      return element;
    case DomDescriptorType.Data:
      return domFactory.createTextNode(st.data.toString());
    case DomDescriptorType.Text:
      return domFactory.createTextNode(st.text);
  }
}
