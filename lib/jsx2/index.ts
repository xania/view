import { RenderTarget } from '../jsx/renderable';
import { JsxFactoryOptions } from '../jsx/options';
import { render } from './render';
import { TemplateInput } from './template-input';
import { flatten } from './_flatten';
import { JsxElement } from './element';

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
          if (result) {
            promises.push(result);
          }
        }
      }

      const result = tagTemplate.appendContent(flatten(children));
      if (result instanceof Array) {
        for (const p of result) promises.push(p);
      }

      if (promises.length > 0)
        return Promise.all(promises).then(() => tagTemplate);
      else return tagTemplate;
    },
    createFragment(_: null, children: any[]) {
      return flatten(children);
    },
  };
}

export function view(tpl: any) {
  return {
    render(target: RenderTarget) {
      return render(tpl, target);
    },
  };
}

export * from './render';
