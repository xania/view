import { flatten } from '../lib/jsx/_flatten';
import { JsxElement } from '@xania/view';

type nameOrFunction = string | Function;

export function jsx(name: nameOrFunction, props: any) {
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

  const promises: Promise<void>[] = [];
  const elt = new JsxElement(name);
  if (props) {
    const { children, ...attrs } = props;
    for (const attrName in attrs) {
      const attrValue = props[attrName];
      const result = elt.setProp(attrName, attrValue);
      if (result instanceof Promise) {
        promises.push(result);
      }
    }
  }

  const result = flatten(elt.appendContent(flatten(props.children)));
  for (const p of result) if (p instanceof Promise) promises.push(p);

  if (promises.length > 0) return Promise.all(promises).then(() => elt);
  else return elt;
}

export function Fragment(props: { children: JSX.Children }) {
  return props.children;
}

export const jsxs = jsx;
