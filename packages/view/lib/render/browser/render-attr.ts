import { ElementNode } from '../../factory';
import { isEventKey } from '../../intrinsic/event-keys';
import { cflat, cpush } from '../../utils/collection';
import { OperatorType } from '../../reactivity/operator';
import { Sandbox } from '../../reactivity/sandbox';
import { State } from '../../reactivity/state';

export function renderAttr(
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
      } else if (curr instanceof State) {
        sandbox.connect(curr.map(split), {
          type: OperatorType.Append,
          list: element.classList,
        });
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
    sandbox.applyEvent(element, attrName, attrValue);
  } else {
    const name = attrName === 'for' ? 'htmlFor' : attrName;

    if (attrValue === null || attrValue === undefined) {
      // ignore
    } else if (attrValue instanceof State) {
      sandbox.connect(attrValue, {
        type: OperatorType.Assign,
        target: element as Record<string, any>,
        property: name,
      });
    } else {
      if (element.namespaceURI === 'http://www.w3.org/2000/svg')
        element.setAttribute(name, attrValue);
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
