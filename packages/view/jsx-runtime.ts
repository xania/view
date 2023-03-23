/// <reference path="./types/jsx/index.d.ts" />

import { intrinsic } from '@xania/view';

type nameOrFunction = string | Function;

export function jsx(name: nameOrFunction, props?: any) {
  if (name instanceof Function) {
    try {
      return name(props);
    } catch (err) {
      // if is class then try with `new` operator
      if (name.toString().startsWith('class')) {
        return Reflect.construct(name, props);
      } else {
        throw err;
      }
    }
  }

  return intrinsic(name, props);
}

export function Fragment(props: { children: JSX.Children }) {
  return props.children;
}

export { jsx as jsxs, jsx as jsxDEV };
