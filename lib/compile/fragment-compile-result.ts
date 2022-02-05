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
    const { children, rootNodes, target } = this;

    const itemsLength = items.length;
    const childrenLength = children.length;
    let offset = rootNodes.length;
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

        target.appendChild(rootNode);
      }
      const fragmentTarget = new FragmentTarget(this.target, childNodes, item);
      rootNodes[i + offset] = fragmentTarget;
    }

    const cust = this.fragmentCustomization;
    if (cust) {
      execute(cust.render, rootNodes, items, offset, itemsLength);
    }

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
          const values = (node as any)[valuesKey];
          let index = 0;
          while (index < rootNodes.length) {
            const fragmentTarget = rootNodes[index];
            if (fragmentTarget[valuesKey] === values) {
              rootNodes.splice(index, 1);
              fragmentTarget.remove();
            }
            index++;
          }
        }
        break;
      case ContainerMutationType.REMOVE_AT:
        {
          const { rootNodes } = this;
          const { index } = mut;
          if (index >= 0 && index < rootNodes.length) {
            const fragmentTarget = rootNodes[index];
            fragmentTarget.remove();
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

            const node1ChildNodes = node1.childNodes;
            for (let i = 0, len = node1ChildNodes.length; i < len; i++) {
              target.insertBefore(node1ChildNodes[i], node2.firstChild);
            }

            const node2ChildNodes = node2.childNodes;
            if (node1NextSibling) {
              for (let i = 0, len = node2ChildNodes.length; i < len; i++) {
                target.insertBefore(node2ChildNodes[i], node1NextSibling);
              }
            } else {
              for (let i = 0, len = node2ChildNodes.length; i < len; i++) {
                target.appendChild(node2ChildNodes[i]);
              }
            }
          }
        }
        break;
      case ContainerMutationType.CLEAR:
        {
          const { target, rootNodes, children } = this;
          const count = children.length;
          if (rootNodes.length) {
            if (
              'textContent' in target &&
              target.childNodes.length === rootNodes.length * count
            ) {
              (target as any).textContent = '';
            } else {
              var rangeObj = new Range();
              rangeObj.setStartBefore(rootNodes[0].firstChild);
              rangeObj.setEndAfter(rootNodes[rootNodes.length - 1].lastChild);
              rangeObj.deleteContents();
            }
          }
          rootNodes.length = 0;
        }
        break;
      case ContainerMutationType.UPDATE_AT:
        {
          const { rootNodes } = this;
          const { index, property, valueFn } = mut;
          if (index < 0 || index >= rootNodes.length) return;

          const fragment = rootNodes[index];
          const values = fragment[valuesKey];
          const newValue = valueFn(values);
          if (!values || values[property] !== newValue) {
            if (values) {
              values[property] = newValue;
            } else {
              values[property] = newValue;
              fragment[valuesKey] = { [property]: newValue };
            }
            for (let i = 0; i < this.children.length; i++) {
              const cust = this.children[i];
              const operations = cust.updates[property];
              if (operations?.length) {
                const node = fragment.childNodes[i];
                execute(operations, [node], [values], 0, 1);
              }
            }
          }
        }
        break;
      // case ContainerMutationType.UPDATE:
      //   {
      //     const { node } = mut;
      //     const { property } = mut;

      //     const values = (node as any)[valuesKey];
      //     const newValue = mut.valueFn(values);
      //     values[property] = newValue;

      //     for (const cust of this.children) {
      //       const operations = cust.updates[property];
      //       if (operations?.length) {
      //         execute(operations, [node], [values], 0, 1);
      //       }
      //     }
      //   }
      //   break;

      default:
        console.error('not supported mutation ', mut);
        break;
    }
  }
}
