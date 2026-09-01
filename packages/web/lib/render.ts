import {
  render,
  RenderState,
  RootScope,
  Sandbox,
  Scope,
  traverse,
} from '@xania/reactivity';
import { DomAutomaton } from './dom-automaton';

export function renderDOM(view: any, root: HTMLElement) {
  const automaton = new DomAutomaton(root);
  var sandbox = new Sandbox(automaton, RootScope);

  if (view === undefined || view === null) {
    return sandbox;
  }

  const renderState: RenderState = {
    viewStack: [view],
    promises: [],
  };

  const retval = traverse(sandbox, renderState, {
    expand(renderState, view) {
      if (view instanceof Array) {
        const { automaton } = sandbox;
        const { currentTarget } = automaton;
        if (currentTarget.output instanceof HTMLElement) {
          let length = view.length;
          while (length--) {
            const item = view[length];
            renderState.viewStack.push(item);
          }
          return true;
        }
      }
      return false;
    },
  });

  if (retval instanceof Promise) {
    renderState.promises.push(retval);
  }

  if (renderState.promises.length) {
    return Promise.all(renderState.promises).then(() => sandbox);
  } else {
    return sandbox;
  }
}
