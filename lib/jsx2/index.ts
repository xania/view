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
        return name(props, children, opts);
      }

      const promises: Promise<void>[] = [];
      const tagTemplate = new JsxElement(name);
      if (props) {
        for (const attrName in props) {
          const attrValue = props[attrName];
          const result = tagTemplate.setProp(
            attrName,
            attrValue,
            opts?.classes
          );
          if (result) {
            promises.push(result);
          }
        }
      }

      const result = tagTemplate.appendTemplates(flatten(children));
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
