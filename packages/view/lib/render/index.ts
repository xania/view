import { Sandbox } from '../reactivity';
import { renderStack } from './browser/render-stack';

export function render(rootChildren: JSX.Children, container: HTMLElement) {
  const sandbox = new Sandbox(container);
  renderStack([[sandbox, container, rootChildren, true]]);
  return sandbox;
}

export * from './unrender';
export * from './ready';
export * from './dom-factory';
export * from './viewable';
export * from './attachable';
