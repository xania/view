import { tmap } from '../../seq';
import { cfirst, cwalk } from '../../reactivity/collection';
import { OperatorType } from '../../reactivity/operator';
import { Sandbox } from '../../reactivity/sandbox';
import { State } from '../../reactivity/state';
import { AnchorElement } from './anchor-element';
import { renderStack } from './render-stack';
import { ListMutation } from '../../reactivity';

export class MutationOperator<T = any> {
  public readonly type = OperatorType.Effect;
  public readonly sandboxes: Sandbox[] = [];
  private readonly rowIndexKey = Symbol();

  public items: T[] = [];

  constructor(
    public children: JSX.Children,
    public currentTarget: Element | AnchorElement
  ) {}

  anchorAt(index: number) {
    const { sandboxes, currentTarget } = this;
    let toAnchorNode: ChildNode | undefined = undefined;
    for (let i = index; i < sandboxes.length; i++) {
      toAnchorNode = cfirst(sandboxes[i].nodes) as ChildNode | undefined;
      if (toAnchorNode) {
        const container =
          currentTarget instanceof AnchorElement
            ? currentTarget.container
            : currentTarget;

        return new AnchorElement(container, toAnchorNode as Element);
      }
    }

    return currentTarget;
  }

  insert(item: T, index: number) {
    const { sandboxes, currentTarget, children, rowIndexKey } = this;
    (item as any)[rowIndexKey] = index;

    const container =
      currentTarget instanceof AnchorElement
        ? currentTarget.container
        : currentTarget;

    const childSandbox = new Sandbox(container, Symbol(index), item);
    const insertAnchor = this.anchorAt(index);
    const template = itemTemplate(children, item);
    renderStack([[childSandbox, insertAnchor, template, true]]);

    for (let i = sandboxes.length; i > index; i--) {
      const preceding = sandboxes[i - 1];
      sandboxes[i] = preceding;
      preceding.model![rowIndexKey] = i;
    }
    sandboxes[index] = childSandbox;
  }

  move(from: number, to: number) {
    const { sandboxes, rowIndexKey } = this;
    const subject = sandboxes[from];
    const toAnchorNode = this.anchorAt(to);
    if (toAnchorNode) {
      cwalk(subject.nodes, (node) => {
        if (node) {
          toAnchorNode.appendChild(node);
        }
      });
    }

    if (to > from) {
      for (let i = from; i < to; i++) {
        const succeeding = sandboxes[i + 1];
        succeeding.model![rowIndexKey] = i;
        sandboxes[i] = succeeding;
      }
    } else {
      for (let i = from; i > to; i--) {
        const preceding = sandboxes[i - 1];
        preceding.model![rowIndexKey] = i;
        sandboxes[i] = preceding;
      }
    }
    subject.model![rowIndexKey] = to;
    sandboxes[to] = subject;
  }

  append(items: T[]) {
    const { currentTarget, children, sandboxes } = this;

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      if (row === null || row === undefined) {
        continue;
      }
      const template = itemTemplate(children, row);

      const container =
        currentTarget instanceof AnchorElement
          ? currentTarget.container
          : currentTarget;

      const childSandbox = new Sandbox(
        container,
        Symbol(sandboxes.length.toString()),
        row
      );

      renderStack([[childSandbox, currentTarget, template, true]]);
      sandboxes.push(childSandbox);
    }
  }

  effect(mutations: ListMutation<any>[]) {
    const { sandboxes, items } = this;

    for (let i = 0; i < mutations.length; i++) {
      const mut = mutations[i];
      switch (mut.type) {
        case 'remove':
          sandboxes[mut.index].dispose();
          sandboxes.splice(mut.index, 1);
          items.splice(mut.index, 1);
          break;
        case 'insert':
          this.insert(mut.item, mut.index);
          items.splice(mut.index, 0, mut.item);
          break;
        case 'append':
          this.append(mut.items);
          items.push(...mut.items);
          break;
        case 'move':
          const { from, to } = mut;
          if (from === to) {
            break;
          }
          this.move(from, to);

          const subject = items[from];
          if (to > from) {
            for (let i = from; i < to; i++) {
              items[i] = items![i + 1];
            }
          } else {
            for (let i = from; i > to; i--) {
              items[i] = items[i - 1];
            }
          }
          items[to] = subject;

          break;
        case 'reset':
          this.items = mut.items;
          this.reset(mut.items);
          break;
        default:
          console.log('unknown mutation', mut);
          break;
      }
    }
  }

  reset(items: T[]) {
    const { sandboxes, rowIndexKey } = this;
    if (sandboxes.length === 0) {
      this.append(items);
    } else {
      for (let i = 0, len = sandboxes.length; i < len; i++) {
        sandboxes[i].model![rowIndexKey] = i;
      }

      for (let j = 0; j < items.length; j++) {
        const newRow = items[j] as any;
        if (newRow !== null && newRow !== undefined) {
          const currentRowIndex = newRow[rowIndexKey];
          if (currentRowIndex !== undefined) {
            newRow[rowIndexKey] = -currentRowIndex - 1; // inverse flag
          }
        }
      }

      let deleteShift = 0;
      const mutations: ListMutation<any>[] = [];
      for (let i = 0, len = sandboxes.length; i < len; i++) {
        const sandbox = sandboxes[i];
        const previousRow = sandbox.model!;
        const currentRowIndex = previousRow[rowIndexKey];
        if (currentRowIndex >= 0) {
          // if positive means row is not contained in new rows.
          sandbox.dispose();
          deleteShift++;
        } else {
          previousRow[rowIndexKey] = i - deleteShift;
          if (deleteShift > 0) sandboxes[i - deleteShift] = sandbox;
        }
      }
      while (deleteShift--) {
        const s = sandboxes.pop()!;
        s.dispose();
      }

      let skipShift = 0;
      for (
        let rowIndex = 0, moveShift = 0, len = items.length;
        rowIndex < len;
        rowIndex++
      ) {
        const row = items[rowIndex] as any;
        if (row === null || row === undefined) {
          skipShift++;
          continue;
        }
        const prevRowIndex = row[rowIndexKey];
        if (prevRowIndex === undefined) {
          // insert at (${rowIndex});
          this.insert(row, rowIndex);
          moveShift++;
        } else if (rowIndex - skipShift === prevRowIndex + moveShift) {
          // no change
        } else {
          // `move (${prevRowIndex + shiftCount} ==> ${rowIndex})`
          const from = prevRowIndex + moveShift;
          const to = rowIndex - skipShift;
          this.move(from, to);
        }
      }

      return mutations;
    }
  }
}

export function itemTemplate(children: JSX.Children, data: any) {
  const state = new State(data);
  return tmap(children, (child) => {
    if (child instanceof Function) {
      return child(state);
    } else {
      return child;
    }
  });
}
