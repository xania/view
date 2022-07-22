import { addEventDelegation } from './event-delegation';
import { RenderTarget } from '../renderable/render-target';
import { component, NodeCustomization } from './helpers';
import { FragmentTarget } from './fragment-target';
import { execute } from './execute';

export interface CompileResult {
  listen(targetElement: RenderTarget): void;
  execute(targetElement: RenderTarget, items: ArrayLike<any>): RenderTarget[];
}

export class NodeCompileResult implements CompileResult {
  constructor(public customization: NodeCustomization) {}

  listen(targetElement: RenderTarget) {
    addEventDelegation(targetElement, this.customization);
  }

  execute(targetElement: RenderTarget, items: ArrayLike<any>) {
    const { customization: cust } = this;
    const { templateNode } = cust;

    const itemsLength = items.length;
    const rootNodes: Node[] = new Array(itemsLength);
    for (let i = 0; i < itemsLength; i++) {
      const rootNode = templateNode.cloneNode(true);
      (rootNode as any)[component] = cust;
      targetElement.appendChild(rootNode as any);
      rootNodes[i] = rootNode;
    }

    execute(cust.render, rootNodes, items, 0, items.length);
    return rootNodes;
  }
}

export class FragmentCompileResult implements CompileResult {
  constructor(
    public fragmentCustomization: NodeCustomization | undefined,
    public children: NodeCustomization[]
  ) {}

  listen(targetElement: RenderTarget) {
    addEventDelegation(targetElement, this.fragmentCustomization);
  }

  execute(targetElement: RenderTarget, items: ArrayLike<any>) {
    const { children } = this;

    const itemsLength = items.length;
    const childrenLength = children.length;
    const rootNodes: FragmentTarget[] = new Array(itemsLength);
    let r = 0;
    for (let i = 0; i < itemsLength; i++) {
      const childNodes = new Array(childrenLength);
      for (let e = 0; e < childrenLength; e++) {
        const cust = children[e];
        const { templateNode } = cust;
        const rootNode = templateNode.cloneNode(true);
        (rootNode as any)[component] = cust;
        childNodes[e] = rootNode;
      }
      rootNodes[r++] = new FragmentTarget(targetElement, childNodes);
    }

    const cust = this.fragmentCustomization;
    if (cust) {
      execute(cust.render, rootNodes, items, 0, itemsLength);
    }

    return rootNodes;
  }
}
