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
