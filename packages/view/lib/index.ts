import { jsxFactory } from './jsx';

export * from './jsx';
export * from './render';
export * from './core';
export * from './render/view';
export * from './ssr/hibernate';

/**
 * default jsx factory
 */
export const jsx = jsxFactory();

export function intrinsic<E extends keyof JSX.IntrinsicElements>(name: E) {
  return (props?: JSX.IntrinsicElements[E], ...children: JSX.Children[]) => {
    return jsx.createElement(name, props, children);
  };
}
