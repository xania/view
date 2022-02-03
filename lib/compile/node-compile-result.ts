import {
  ContainerMutation,
  ContainerMutationType,
} from '../container/mutation';
import { RenderTarget } from '../renderable/render-target';
import { CompileResult } from './compile-result';
import { addEventDelegation } from './event-delegation';
import { execute } from './execute';
import { componentKey, NodeCustomization, valuesKey } from './helpers';

export class NodeCompileResult implements CompileResult {
  private rootNodes: Node[] = [];
  constructor(
    public target: RenderTarget,
    public customization: NodeCustomization
  ) {}

  listen() {
    addEventDelegation(this.target, this.customization);
  }

  execute(items: ArrayLike<any>) {
    const { customization: cust, rootNodes } = this;
    const { templateNode } = cust;

    const itemsLength = items.length;
    const offset = rootNodes.length;
    rootNodes.length = offset + itemsLength;
    for (let i = 0; i < itemsLength; i++) {
      const rootNode = templateNode.cloneNode(true);
      (rootNode as any)[componentKey] = cust;
      (rootNode as any)[valuesKey] = items[i];
      this.target.appendChild(rootNode as any);
      rootNodes[i + offset] = rootNode;
    }

    execute(cust.render, rootNodes, items, offset, items.length);
    return rootNodes;
  }

  next(mut: ContainerMutation) {
    switch (mut.type) {
      case ContainerMutationType.PUSH_MANY:
        this.execute(mut.items);
        break;
      case ContainerMutationType.REMOVE:
        {
          const { rootNodes } = this;
          const { node } = mut;
          const index = rootNodes.indexOf(node);
          if (index >= 0 && index < rootNodes.length) {
            rootNodes.splice(index, 1);
            this.target.removeChild(node);
          }
        }
        break;
      case ContainerMutationType.REMOVE_AT:
        {
          const { rootNodes } = this;
          const { index } = mut;
          if (index >= 0 && index < rootNodes.length) {
            const node = rootNodes[index];
            this.target.removeChild(node);
            rootNodes.splice(index, 1);
          }
        }
        break;
      case ContainerMutationType.SWAP:
        {
          const { rootNodes, target } = this;
          const { index1, index2 } = mut;
          const rootNodesLength = rootNodes.length;
          if (
            index1 >= 0 &&
            index1 < rootNodesLength &&
            index2 >= 0 &&
            index2 < rootNodesLength
          ) {
            const node1 = rootNodes[index1];
            const node1NextSibling = node1.nextSibling;
            const node2 = rootNodes[index2];

            rootNodes[index1] = node2;
            rootNodes[index2] = node1;

            target.insertBefore(node1, node2);
            if (node1NextSibling) target.insertBefore(node2, node1NextSibling);
            else target.appendChild(node2);
          }
        }
        break;
      case ContainerMutationType.CLEAR:
        {
          const { target, rootNodes } = this;
          if (rootNodes.length) {
            if (
              'textContent' in target &&
              target.childNodes.length === rootNodes.length
            ) {
              (target as any).textContent = '';
            } else {
              var rangeObj = new Range();
              rangeObj.setStartBefore(rootNodes[0]);
              rangeObj.setEndAfter(rootNodes[rootNodes.length - 1]);
              rangeObj.deleteContents();
            }
          }
          rootNodes.length = 0;
        }
        break;
      case ContainerMutationType.UPDATE:
        {
          const { node } = mut;
          const { property } = mut;

          const values = (node as any)[valuesKey];
          const newValue = mut.valueFn(values);
          values[property] = newValue;

          const operations = this.customization.updates[property];
          if (operations?.length) {
            execute(operations, [node], [values], 0, 1);
          }
        }
        break;
      default:
        console.error('not supported mutation ', mut);
        break;
    }
  }
}
