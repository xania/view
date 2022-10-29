import { createElement, createFragment } from './create-element';

interface JsxFactoryConfig {
  classes?: { [name: string]: string };
}
export function jsxFactory(config: JsxFactoryConfig) {
  if (!config.classes)
    return {
      createElement,
      createFragment,
    };

  const { classes } = config;

  function mapClass(cls: string | string[]): string | string[] {
    if (cls instanceof Array) {
      return flatten(cls, mapClass);
    }
    return cls.split(' ').map((cls) => classes[cls] || cls);
  }

  return {
    createElement(
      name: string | Function | null,
      props: any = null,
      ...children: unknown[]
    ) {
      const attrs: any = {};
      for (let attrName in props) {
        const attrValue = props[attrName];
        if (attrName === 'class') {
          attrs[attrName] = mapClass(attrValue);
        } else {
          attrs[attrName] = attrValue;
        }
      }
      return createElement(name, attrs, ...children);
    },
    createFragment,
  };
}

function flatten<T>(tree: T[], childrenFn: (node: T) => T[] | T | undefined) {
  const retval: T[] = [];
  if (!tree) return retval;
  type StackType = T | StackType[] | undefined;

  const stack: StackType[] = [];
  for (let i = 0; i < tree.length; i++) {
    stack[i] = tree[i];
  }
  while (stack.length > 0) {
    var curr = stack.pop() as StackType;
    if (curr instanceof Array) {
      let length = curr.length;
      while (length--) {
        stack.push(curr[length]);
      }
    } else if (curr !== null && curr !== undefined) {
      const children = childrenFn(curr);
      if (children) {
        if (children instanceof Array)
          for (let i = children.length - 1; i >= 0; i--) {
            retval.push(children[i]);
          }
      }
    }
  }
  return retval;
}
