import { addEventDelegation } from './event-delegation';
import { RenderTarget } from '../renderable/render-target';
import { component, NodeCustomization } from './helpers';
import { FragmentTarget } from './fragment-target';
import { execute } from './execute';

export interface CompileResult {
  listen(targetElement: RenderTarget): void;
  render(targetElement: RenderTarget, items: ArrayLike<any>): RenderTarget[];
}

export class NodeCompileResult implements CompileResult {
  constructor(public customization: NodeCustomization) {}

  listen(targetElement: RenderTarget) {
    addEventDelegation(targetElement, this.customization);
  }

  render(targetElement: RenderTarget, items: ArrayLike<any>) {
    const { customization: cust } = this;
    const { templateNode } = cust;

    const rootNodes = cust.nodes;
    const offset = rootNodes.length;

    function createRootNode(_: any, idx: number) {
      const rootNode = templateNode.cloneNode(true);
      (rootNode as any)[component] = cust;
      targetElement.appendChild(rootNode as any);
      rootNodes[idx + offset] = rootNode;
      return rootNode;
    }

    // for (let i = 0, qlen = queries.length; i < qlen; i++) {
    //   const query = queries[i];
    //   if (query.type === QueryType.Index) {
    //     const index = query.index;
    //     const values = items[index];
    //     const rootNode = rootNodes[index + offset];
    //   }
    // }

    execute(cust.render, items, createRootNode);
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

  render(targetElement: RenderTarget, items: ArrayLike<any>) {
    const { children } = this;

    const itemsLength = items.length;
    const childrenLength = children.length;
    const rootNodes: FragmentTarget[] = new Array(itemsLength);
    let r = 0;

    function createRootNode() {
      const childNodes = new Array(childrenLength);
      for (let e = 0; e < childrenLength; e++) {
        const cust = children[e];
        const { templateNode } = cust;
        const rootNode = templateNode.cloneNode(true);
        (rootNode as any)[component] = cust;
        childNodes[e] = rootNode;
      }
      const target = new FragmentTarget(targetElement, childNodes);
      rootNodes[r++] = target;
      return target;
    }

    const cust = this.fragmentCustomization;
    if (cust) {
      execute(cust.render, items, createRootNode);
    }

    return rootNodes;
  }
}
