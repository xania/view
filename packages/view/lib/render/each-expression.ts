import { AnchorNode, NodeFactory, TextNode } from '../factory';
import {
  DomDescriptorType,
  StaticElementDescriptor,
  TextDescriptor,
  isDomDescriptor,
} from '../intrinsic';
import { Reactive, Sandbox, each } from '../reactivity';
import { renderStack } from './browser/render-stack';

type StaticTemplate = StaticElementDescriptor | TextDescriptor;

interface ForEachProps<T> {
  source: Reactive<T[]>;
  children: JSX.Children;
}
export function ForEach<T>(props: ForEachProps<T>) {
  return new ForEachExpression(props.source, props.children);
}

export class ForEachExpression<T> {
  constructor(public source: Reactive<T[]>, public template: JSX.Children) {}

  render(sandbox: Sandbox, x: any) {
    // const template = this.compile();

    const { source } = this;

    const offline = new Sandbox();
    const factory: NodeFactory<Element, any> = {
      createComment(parentElement, data) {
        throw Error('');
      },
      createElement(parentElement, name) {
        return document.createElement(name);
      },
      createTextNode(parentElement, data) {
        const textNode = document.createTextNode(data);

        if (parentElement instanceof AnchorNode) {
          parentElement.anchorNode;
        } else {
        }

        return textNode as any;
      },
      applyEvent(sandbox, target, eventName, eventHandler) {
        throw Error('');
      },
    };
    renderStack(offline, this.template, factory, offline as any);

    console.log(offline.nodes);

    // const mutations = changes(source, e => ({}));
    sandbox.track(
      each(source, (e) => {
        // console.log(e, template);
        return {};
      })
    );
  }

  compile(): StaticTemplate[] {
    const { template } = this;
    const root: Parent = [];
    type Parent = StaticTemplate[];
    const stack: [Parent, any][] = [[root, template]];

    while (stack.length) {
      const [parent, tpl] = stack.pop()!;
      if (tpl === undefined || tpl === null) {
        // skip
        continue;
      }
      const ctor = tpl.constructor;

      if (ctor === Number) {
        const elt = {
          text: String(tpl),
          type: DomDescriptorType.Text,
        } satisfies TextDescriptor;
        parent.push(elt);
      } else if (isDomDescriptor(tpl)) {
        switch (tpl.type) {
          case DomDescriptorType.Element:
            const elt = {
              name: tpl.name,
              type: DomDescriptorType.StaticElement,
              attrs: [],
              children: [],
            } satisfies StaticElementDescriptor;
            parent.push(elt);
            if (tpl.attrs) {
              // stack.push([elt.attrs, tpl.attrs]);
            }
            if (tpl.children) {
              stack.push([elt.children, tpl.children]);
            }
            break;
        }
      } else {
        console.warn('unsupported', tpl);
      }
    }

    return root;
  }
}
