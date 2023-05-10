import { cfirst, cwalk } from '../../utils/collection';
import { Sandbox } from '../../reactivity/sandbox';
import { renderStack } from './render-stack';
import { ListMutation, State } from '../../reactivity';
import { AnchorNode, ElementNode, NodeFactory, ViewNode } from '../../factory';

export class MutationOperator<T = any> {
  public readonly sandboxes: Sandbox[] = [];

  constructor(
    public sandbox: Sandbox,
    public template: JSX.Children,
    public currentTarget: ElementNode | AnchorNode<ViewNode>,
    public listItem: State<T[]>,
    public factory: NodeFactory<ElementNode, ViewNode>
  ) {}

  anchorAt(index: number) {
    const { sandboxes, currentTarget } = this;
    let toAnchorNode: ViewNode | undefined = undefined;
    for (let i = index; i < sandboxes.length; i++) {
      toAnchorNode = cfirst(sandboxes[i].nodes);
      if (toAnchorNode) {
        return new AnchorNode(toAnchorNode);
      }
    }

    return currentTarget;
  }

  insert(item: T, index: number) {
    const { sandboxes, listItem } = this;
    const { key: key } = listItem;
    (item as any)[key] = index;

    const childSandbox = new Sandbox(this.sandbox);
    childSandbox[key] = item;

    const insertAnchor = this.anchorAt(index);
    renderStack(
      [[childSandbox, insertAnchor, this.template, true]],
      this.factory
    );

    for (let i = sandboxes.length; i > index; i--) {
      const preceding = sandboxes[i - 1];
      sandboxes[i] = preceding;
      preceding[key]![key] = i;
    }
    sandboxes[index] = childSandbox;
  }

  move(from: number, to: number) {
    const { sandboxes, listItem } = this;
    const { key: key } = listItem;
    const subject = sandboxes[from];
    const toAnchorNode = this.anchorAt(to);
    if (toAnchorNode) {
      cwalk(subject.nodes, (node) => {
        if (node) {
          // toAnchorNode.appendChild(node);
        }
      });
    }

    if (to > from) {
      for (let i = from; i < to; i++) {
        const succeeding = sandboxes[i + 1];
        succeeding[key]![key] = i;
        sandboxes[i] = succeeding;
      }
    } else {
      for (let i = from; i > to; i--) {
        const preceding = sandboxes[i - 1];
        preceding[key]![key] = i;
        sandboxes[i] = preceding;
      }
    }
    subject[key]![key] = to;
    sandboxes[to] = subject;
  }

  append(items: T[]) {
    const { sandboxes, currentTarget, template, listItem } = this;
    const { key: key } = listItem;

    for (let i = 0; i < items.length; i++) {
      const row = items[i] as any;
      if (row === null || row === undefined) {
        continue;
      }
      row[key] = sandboxes.length;

      const childSandbox = new Sandbox(this.sandbox);
      childSandbox[key] = row;

      renderStack(
        [[childSandbox, currentTarget, template, true]],
        this.factory
      );
      sandboxes.push(childSandbox);
    }
  }

  effect = (mutations: ListMutation<any>[]): any => {
    const { sandboxes, listItem } = this;
    // const { items } = listItem;

    for (let i = 0; i < mutations.length; i++) {
      const mut = mutations[i];
      switch (mut.type) {
        case 'remove':
          sandboxes[mut.index].dispose();
          sandboxes.splice(mut.index, 1);
          // items.splice(mut.index, 1);
          break;
        case 'insert':
          this.insert(mut.item, mut.index);
          // items.splice(mut.index, 0, mut.item);
          break;
        case 'append':
          this.append(mut.items);
          // items.push(...mut.items);
          break;
        case 'move':
          const { from, to } = mut;
          if (from === to) {
            break;
          }
          this.move(from, to);

          // const subject = items[from];
          // if (to > from) {
          //   for (let i = from; i < to; i++) {
          //     items[i] = items![i + 1];
          //   }
          // } else {
          //   for (let i = from; i > to; i--) {
          //     items[i] = items[i - 1];
          //   }
          // }
          // items[to] = subject;

          break;
        case 'reset':
          // listItem.items = mut.items;
          this.reset(mut.items);
          break;
        default:
          console.log('unknown mutation', mut);
          break;
      }
    }
  };

  reset(items: T[]) {
    const { sandboxes, listItem } = this;
    const { key: key } = listItem;
    if (sandboxes.length === 0) {
      this.append(items);
    } else {
      for (let j = 0; j < items.length; j++) {
        const newRow = items[j] as any;
        if (newRow !== null && newRow !== undefined) {
          const currentRowIndex = newRow[key];
          if (currentRowIndex !== undefined) {
            if (sandboxes[currentRowIndex][key] !== newRow) {
              sandboxes[currentRowIndex][key] = newRow;
              // listItem.items[currentRowIndex] = newRow;
              sandboxes[currentRowIndex].reconcile(0);
            }
            newRow[key] = -currentRowIndex - 1; // inverse flag
          }
        }
      }

      let deleteShift = 0;
      const mutations: ListMutation<any>[] = [];
      for (let i = 0, len = sandboxes.length; i < len; i++) {
        const sandbox = sandboxes[i];
        const previousRow = sandbox[key]!;
        const currentRowIndex = previousRow[key];
        if (currentRowIndex >= 0) {
          // if positive means row is not contained in new rows.
          sandbox.dispose();
          deleteShift++;
        } else {
          previousRow[key] = i - deleteShift;
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
        const prevRowIndex = row[key];
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
