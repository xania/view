// import { DomDescriptorType, isDomDescriptor } from '../intrinsic';
import {
  Automaton,
  ITextNode,
  popScope,
  SetProperty,
  TextNodeUpdater,
} from './automaton';
import { Sandbox } from './sandbox';
import { State, Value, Arrow, FuncArrow } from './state';

export function render(
  view: any,
  automaton: Automaton
): Promise<Sandbox> | Sandbox {
  const sandbox = new Sandbox();

  if (view === undefined || view === null) {
    return sandbox;
  }

  const viewStack = [view];

  const promises: Promise<void>[] = [];
  const retval = loop();

  if (retval instanceof Promise) {
    promises.push(retval);
  }

  if (promises.length) {
    return Promise.all(promises).then(() => sandbox);
  } else {
    return sandbox;
  }

  function loop(): void | Promise<void> {
    while (viewStack.length) {
      const curr = viewStack.pop()!;
      if (curr === null || curr === undefined) {
        continue;
      } else if (curr instanceof Promise) {
        return curr.then((resolved) => {
          viewStack.push(resolved);
          return loop();
        });
      } else if (curr.constructor === String) {
        automaton.appendText(curr);
      } else if (curr.constructor === Number) {
        automaton.appendText(curr);
      } else if (curr instanceof State) {
        const textNode = automaton.appendText('');
        const res = sandbox.bindTextNode(curr, textNode);
        if (res) {
          promises.push(res);
        }
      } else if (curr === popScope) {
        automaton.up();
      } else {
        const children = automaton.appendElement(curr);
        if (
          children !== null &&
          children !== undefined &&
          children.length > 0
        ) {
          for (let i = children.length - 1; i >= 0; i--) {
            const item = children[i];
            if (item !== null && item !== undefined) {
              viewStack.push(item);
            }
          }
        }
      }
    }
  }
}
