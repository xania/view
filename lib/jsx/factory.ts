import { TemplateInput } from '../jsx/template-input';
import { flatten } from '../jsx/_flatten';
import { JsxElement } from '../jsx/element';

export interface JsxFactoryOptions {
  classes?: {
    [p: string]: string;
  };
}

type CreateIntrinsicElement = (
  name: string,
  props: any,
  ...children: TemplateInput[]
) => JsxElement | Promise<JsxElement> | undefined;

export function jsxFactory(opts?: JsxFactoryOptions) {
  return {
    createElement(
      name: string | Function,
      props: any = null,
      ...children: TemplateInput[]
    ): JsxElement | Promise<JsxElement> | undefined {
      if (name instanceof Function) {
        try {
          return name(props, children, opts);
        } catch (err) {
          // if is class then try with `new` operator
          if (name.toString().startsWith('class')) {
            return Reflect.construct(name, [props, children]);
          } else {
            throw err;
          }
        }
      }

      const promises: Promise<void>[] = [];
      const tagTemplate = new JsxElement(name);
      if (props) {
        for (const attrName in props) {
          const attrValue = props[attrName];
          const result = tagTemplate.setProp(attrName, attrValue, opts);
          if (result instanceof Promise) {
            promises.push(result);
          }
        }
      }

      const result = flatten(tagTemplate.appendContent(flatten(children)));
      for (const p of result) if (p instanceof Promise) promises.push(p);

      if (promises.length > 0)
        return Promise.all(promises).then(() => tagTemplate);
      else return tagTemplate;
    },
    createFragment(_: null, children: any[]) {
      return flatten(children);
    },
  } as {
    createElement: CreateIntrinsicElement;
  };
}
