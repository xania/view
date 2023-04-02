/// <reference path="./types/jsx/index.d.ts" />

import { intrinsic, Component } from '@xania/view';

type nameOrFunction = string | Function;

export function jsx(name: nameOrFunction, props?: any) {
  if (name === Fragment) {
    return Fragment(props);
  } else if (name instanceof Function) {
    return new Component(name, props);
  }

  return intrinsic(name, props);
}

export function Fragment(props: { children: JSX.Children }) {
  return props.children;
}

export { jsx as jsxs, jsx as jsxDEV };
