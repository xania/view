/// <reference path="./types/jsx/index.d.ts" />

import { intrinsic } from 'xania';

export function jsx(view: any, props?: any) {
  if (view instanceof Function) {
    try {
      return view(props);
    } catch (err) {
      // if is class then try with `new` operator
      if (view.toString().startsWith('class')) {
        return Reflect.construct(view, props);
      } else {
        throw err;
      }
    }
  }

  return intrinsic(view, props);
}

export function Fragment(props: { children: JSX.Children }) {
  return props.children;
}

export { jsx as jsxs, jsx as jsxDEV };
