import {
  ContainerMutation,
  ContainerMutationType,
} from '../container/mutation';
import { RenderTarget } from '../renderable/render-target';
import { CompileResult } from './compile-result';
import { addEventDelegation } from './event-delegation';
import { execute } from './execute';
import { FragmentTarget } from './fragment-target';
import { componentKey, NodeCustomization, valuesKey } from './helpers';

export class FragmentCompileResult implements CompileResult {
  private rootNodes: FragmentTarget[] = [];
  constructor(
    public target: RenderTarget,
    public fragmentCustomization: NodeCustomization | undefined,
    public children: NodeCustomization[]
  ) {}

  listen() {
    addEventDelegation(this.target, this.fragmentCustomization);
  }

  execute(items: ArrayLike<any>) {
    const { children, rootNodes } = this;

    const itemsLength = items.length;
    const childrenLength = children.length;
    let r = rootNodes.length;
    for (let i = 0; i < itemsLength; i++) {
      const childNodes = new Array(childrenLength);
      const item = items[i];
      for (let e = 0; e < childrenLength; e++) {
        const cust = children[e];
        const { templateNode } = cust;
        const rootNode = templateNode.cloneNode(true);
        (rootNode as any)[componentKey] = cust;
        (rootNode as any)[valuesKey] = item;
        childNodes[e] = rootNode;
      }
      rootNodes[r++] = new FragmentTarget(this.target, childNodes);
    }

    const cust = this.fragmentCustomization;
    if (cust) {
      execute(cust.render, rootNodes, items, 0, itemsLength);
    }

    return rootNodes;
  }

  next(mut: ContainerMutation) {
    switch (mut.type) {
      case ContainerMutationType.PUSH_MANY:
        this.execute(mut.items);
        break;
      default:
        console.error('not supported mutation ', mut);
        break;
    }
  }
}
