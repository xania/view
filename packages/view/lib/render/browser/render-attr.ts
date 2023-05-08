import { ElementNode } from '../../factory';
import { isEventKey } from '../../intrinsic/event-keys';
import { cpush } from '../../utils/collection';
import { Sandbox } from '../../reactivity/sandbox';
import { EventManager } from '../../reactivity/event-manager';
import { Append, Reactive } from '../../reactivity';

export function renderAttr(
  eventManager: EventManager<ElementNode>,
  sandbox: Sandbox,
  element: ElementNode,
  attrName: string,
  attrValue: any,
  isRoot: boolean
) {
  if (attrName === 'class' || attrName === 'className') {
    const stack: any[] = [attrValue];
    while (stack.length) {
      const curr = stack.pop();
      if (curr === undefined || curr === null) {
        // ignore
      } else if (curr instanceof Array) {
        stack.push(...curr);
      } else if (curr instanceof Reactive) {
        sandbox.track(new Append(curr.map(split), element.classList));
      } else if (curr.constructor === String) {
        for (const item of curr.split(' ')) {
          const cl = item.trim();
          if (cl) {
            element.classList.add(cl);
            if (isRoot) {
              sandbox.classList = cpush(sandbox.classList, cl);
            }
          }
        }
      }
    }
  } else if (isEventKey(attrName)) {
    eventManager.applyEvent(sandbox, element as any, attrName, attrValue);
  } else {
    const name = attrName === 'for' ? 'htmlFor' : attrName;

    const isSvg = element.namespaceURI === 'http://www.w3.org/2000/svg';

    if (attrValue === null || attrValue === undefined) {
      // ignore
    } else if (attrValue instanceof Reactive) {
      if (isSvg) {
        sandbox.track(
          attrValue.effect((newValue: string) => {
            (element as any as SVGElement).setAttribute(name, newValue);
          })
        );
      } else {
        sandbox.track(attrValue.assign(element, name as any));
      }
    } else {
      if (isSvg) element.setAttribute(name, attrValue);
      else {
        (element as any)[name] = attrValue;
      }
    }
  }
}

function split(s: string | string[]) {
  const stack = [s];
  const ret: string[] = [];

  while (stack.length) {
    const curr = stack.pop()!;
    if (curr === null || curr === undefined) {
      // ignore
    } else if (curr instanceof Array) {
      for (let i = curr.length - 1; i >= 0; i--) {
        stack.push(curr[i]);
      }
    } else if (curr.constructor === String) {
      for (const s of curr.split(' ')) {
        if (s) {
          ret.push(s);
        }
      }
    }
  }

  return ret;
}
