import { Sandbox } from '../reactivity';
import { Browser } from './browser';
import { renderStack } from './browser/render-stack';

export function render(rootChildren: JSX.Children, container: HTMLElement) {
  const browser = new Browser(container);
  const sandbox = new Sandbox();
  renderStack<any, any>(
    [[sandbox, container as any, rootChildren, true]],
    browser
  );
  return sandbox;
}

export function renderMany(...pairs: [JSX.Children, HTMLElement][]) {
  const browser = new Browser(document.body);
  const sandbox = new Sandbox();

  for (const pair of pairs) {
    const [rootChildren, container] = pair;

    renderStack<any, any>(
      [[sandbox, container as any, rootChildren, true]],
      browser
    );
  }
  return sandbox;
}

export * from './unrender';
export * from './ready';
export * from './viewable';
export * from './attachable';
export * from './browser/render-stack';
export * from './transformer';
