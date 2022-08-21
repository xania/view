import { RenderTarget } from '../renderable/render-target';
import { component, distinct, dom, NodeCustomization, values } from './helpers';
import { execute } from './execute';
import { DomOperationType } from './dom-operation';
import { compile } from '.';
import { Template } from '../template';
import CompileResult from './compile-result';
import {
  ContainerMutation,
  ContainerMutationType,
} from '../container/mutation';

export class ViewBinding {
  public vdata: any[] = [];
  public customization: NodeCustomization | null;
  constructor(
    template: Template | CompileResult,
    private target: RenderTarget
  ) {
    const compiled = compile(template);
    if (compiled) {
      const cust = compiled.customization;
      this.customization = cust;
    } else {
      this.customization = null;
    }
    this.listen();
  }

  next(mut: ContainerMutation) {
    switch (mut.type) {
      case ContainerMutationType.CLEAR:
        this.clear();
        break;
      case ContainerMutationType.REMOVE_AT:
        this.removeAt(mut.index);
        break;
      case ContainerMutationType.MOVE:
        this.moveTo(mut.from, mut.to);
        break;
      case ContainerMutationType.RENDER:
        this.render(mut.data);
        break;
    }
  }

  private listen() {
    const { customization, target: rootContainer, vdata } = this;
    if (!customization) return;

    const eventNames = distinct(Object.keys(customization.events));
    for (const eventName of eventNames) {
      rootContainer.addEventListener(eventName, handler);
    }

    return {
      unsubscribe() {
        for (const eventName of eventNames) {
          rootContainer.removeEventListener(eventName, handler);
        }
      },
    };

    function handler(evt: Event) {
      const eventName = evt.type;
      const eventTarget = evt.target as Node;

      let rootNode: Node | null = eventTarget;
      if (!rootNode) return;
      let cust: NodeCustomization | null = null;

      do {
        cust = (rootNode as any)[component] as NodeCustomization;
        if (cust) break;
      } while ((rootNode = rootNode.parentNode));

      if (customization !== cust || !rootNode) return;

      const operations = customization.events[eventName];
      if (!operations || !operations.length) return;

      const renderStack: Node[] = [rootNode];
      let renderIndex = 0;
      for (let n = 0, len = operations.length | 0; n < len; n = (n + 1) | 0) {
        const operation = operations[n];
        const curr = renderStack[renderIndex];
        switch (operation.type) {
          case DomOperationType.PushChild:
            renderStack[++renderIndex] = curr.childNodes[
              operation.index
            ] as HTMLElement;
            break;
          case DomOperationType.PushFirstChild:
            renderStack[++renderIndex] = curr.firstChild as HTMLElement;
            break;
          case DomOperationType.PushNextSibling:
            renderStack[++renderIndex] = curr.nextSibling as HTMLElement;
            break;
          case DomOperationType.PopNode:
            renderIndex--;
            break;
          case DomOperationType.AddEventListener:
            if (eventTarget === curr || curr.contains(eventTarget)) {
              for (let i = 0; i < vdata.length; i++) {
                const vitem = vdata[i];
                if (vitem[dom] === rootNode) {
                  operation.handler({
                    index: i,
                    values: vitem[values],
                    event: evt,
                  });
                }
              }
            }
            break;
        }
      }
    }
  }

  removeAt(index: number) {
    const { vdata } = this;
    this.target.removeChild(vdata[index][dom]);
    vdata.splice(index, 1);
  }

  clear() {
    const { vdata, target } = this;
    const length = vdata.length | 0;

    if (length) {
      if (target.childNodes.length === length) {
        target.textContent = '';
      } else {
        const rangeObj = new Range();
        rangeObj.setStartBefore(vdata[0][dom]);
        rangeObj.setEndAfter(vdata[length - 1][dom]);

        rangeObj.deleteContents();
      }
    }
    vdata.length = 0;
  }

  render(data: ArrayLike<any>) {
    const { vdata, customization, target } = this;
    if (!customization) return;
    const { updates } = customization;

    const offset = vdata.length;
    const length = data.length;

    if (length > offset) {
      const { templateNode } = customization;
      for (let i = offset; i < length; i++) {
        const clone = templateNode.cloneNode(true);
        (clone as any)[component] = customization;
        target.appendChild(clone);
        const item = data[i] as any;
        const vitem: any = {
          [dom]: clone,
          [values]: item,
        };
        if (item) {
          for (const property in updates) {
            const newValue = item[property];
            vitem[property] = newValue;
          }
        }
        vdata.push(vitem);
      }
      execute(customization.render, vdata, {
        target,
        data: vdata,
        offset,
      });
    }

    if (offset > 0) {
      for (const property in updates) {
        const operations = updates[property];
        if (!operations) break;
        const dirty: any[] = [];
        for (let i = 0; i < offset; i++) {
          const item = data[i] as any;
          let vitem = vdata[i] as any;
          vitem[values] = item;

          if (!item) {
            continue;
          }

          const newValue = item[property];
          vitem[values] = item;
          const prevValue = vitem[property];
          if (prevValue !== newValue) {
            vitem[property] = newValue;
            dirty.push(vitem);
          }
        }
        if (dirty.length)
          execute(operations, dirty, {
            target,
            data: vdata,
            offset: 0,
          });
      }
    }
  }

  moveTo(from: number, to: number) {
    if (from === to) {
      return;
    }
    const { vdata } = this;
    const fromItem = vdata[from];
    const toItem = vdata[to];
    const fromNode: HTMLElement = fromItem[dom];
    const toNode: HTMLElement = toItem[dom];

    if (from < to) {
      toNode.insertAdjacentElement('afterend', fromNode);
      for (let i = from + 1; i <= to; i++) {
        vdata[i - 1] = vdata[i];
      }
    } else if (from > to) {
      toNode.insertAdjacentElement('beforebegin', fromNode);
      for (let i = from; i > to; i--) {
        vdata[i] = vdata[i - 1];
      }
    }
    vdata[to] = fromItem;
  }
}
