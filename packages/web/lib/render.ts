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

  const renderState: RenderState = {
    viewStack: [view],
    promises: [],
  };

  return traverse(sandbox, renderState, {
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
}
