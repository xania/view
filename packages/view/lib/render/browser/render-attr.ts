import { isEventKey } from '../../intrinsic/event-keys';
import { cflat } from '../../reactivity/collection';
import { OperatorType } from '../../reactivity/operator';
import { Sandbox } from '../../reactivity/sandbox';
import { State } from '../../reactivity/state';

export function renderAttr(
  sandbox: Sandbox,
  element: Element,
  attrName: string,
  attrValue: any
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
            if (sandbox.container === element) {
              const { classList } = sandbox;
              if (classList === undefined) {
                sandbox.classList = cl;
              } else if (classList instanceof Array) {
                classList.push(cl);
              } else {
                sandbox.classList = [classList, cl];
              }
            }
          }
        }
      }
    }
  } else if (isEventKey(attrName)) {
    sandbox.applyEvent(element as HTMLElement, attrName, attrValue);
  } else {
    const name = attrName === 'for' ? 'htmlFor' : attrName;

    if (attrValue === null || attrValue === undefined) {
      // ignore
    } else if (attrValue instanceof State) {
      sandbox.connect(attrValue, {
        type: OperatorType.Assign,
        target: element as HTMLElement & Record<string, any>,
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
