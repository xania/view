import { Sandbox } from '../reactivity';
import { renderStack } from './browser/render-stack';

export function render(rootChildren: JSX.Children, container: HTMLElement) {
  const sandbox = new Sandbox(container as any);
  renderStack(
    [[sandbox, container as any, rootChildren, true]],
    document as any
  );
  return sandbox;
}

export * from './unrender';
export * from './ready';
export * from './viewable';
export * from './attachable';
