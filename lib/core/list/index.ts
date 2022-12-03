import { createEventHandler, JsxElement } from '../../jsx/element';
import { RenderTarget } from '../../jsx';
import { execute, ExecuteContext } from '../../render/execute';
import { ListSource } from './list-source';
import { ListMutationType } from './mutation';

export interface ListProps<T> {
  source: T[] | ListSource<T>;
}

export * from './list-source';
export * from './mutation';

export function List<T extends any>(
  props: ListProps<T>,
  children: JsxElement[]
) {
  return {
    render(target: RenderTarget) {
      const sharedEventHandler = createEventHandler(target);
      const source = props.source;
      let virtualItems: VirtualItem[] = [];

      if (source instanceof Array) {
        renderChildren(source);
      } else if (source instanceof ListSource) {
        source.subscribe({
          next(mut) {
            switch (mut.type) {
              case ListMutationType.Push:
                renderChild(mut.item);
                break;
              case ListMutationType.Insert:
                renderChild(mut.item, mut.index);
                break;
              case ListMutationType.DeleteAt:
                deleteChild(mut.index);
                break;
              case ListMutationType.Clear:
                clear();
                break;
              case ListMutationType.Move:
                moveChild(mut.from, mut.to);
                break;
              case ListMutationType.Update:
                updateChild(mut.offset, mut.length);
                break;
              case ListMutationType.Concat:
                renderChildren(mut.items);
                break;
            }
          },
        });
        renderChildren(source);
      }

      function clear(
        firstIdx: number = 0,
        lastIdx: number = virtualItems.length - 1
      ) {
        if (lastIdx <= firstIdx) return;

        const rangeObj = new Range();
        rangeObj.setStartBefore(virtualItems[firstIdx].firstElement as Node);
        rangeObj.setEndAfter(virtualItems[lastIdx].lastElement as Node);

        rangeObj.deleteContents();

        for (let i = firstIdx; i <= lastIdx; i++) {
          const vi = virtualItems[i];
          const { bindings, subscriptions } = vi;

          let blength = bindings.length;
          while (blength--) {
            bindings[blength].dispose();
          }

          let slength = subscriptions.length;
          while (slength--) {
            subscriptions[slength].unsubscribe();
          }

          // let elength = elements.length;
          // while (elength--) {
          //   elements[elength].remove();
          // }
        }
        virtualItems.length = 0;
      }

      function updateChild(offset: number, length: number) {
        for (let i = offset; i < length; i++) {
          var vi = virtualItems[i];

          let elementIdx = 0;
          for (const child of children) {
            if (child instanceof JsxElement) {
              const root = vi.elements[elementIdx++];
              execute(child.updates, root, vi);
            }
          }
        }
      }

      function moveChild(fromIdx: number, toIdx: number) {
        if (fromIdx === toIdx) return;
        const from = virtualItems[fromIdx];
        const to = virtualItems[toIdx];

        const referenceNode =
          fromIdx < toIdx ? to.nextSibling : to.firstElement;
        for (const elt of from.elements) {
          target.insertBefore(elt, referenceNode);
        }

        if (fromIdx < toIdx) {
          for (let i = fromIdx; i < toIdx; i++) {
            virtualItems[i] = virtualItems[i + 1];
          }
          virtualItems[toIdx] = from;
        } else {
          for (let i = fromIdx; i > toIdx; i--) {
            virtualItems[i] = virtualItems[i - 1];
          }
          virtualItems[toIdx] = from;
        }
      }

      function deleteChild(index: number) {
        const vi = virtualItems[index];
        const { bindings, subscriptions, elements } = vi;

        let blength = bindings.length;
        while (blength--) {
          bindings[blength].dispose();
        }

        let slength = subscriptions.length;
        while (slength--) {
          subscriptions[slength].unsubscribe();
        }

        let elength = elements.length;
        while (elength--) {
          elements[elength].remove();
        }

        const len = virtualItems.length;
        for (let i = index + 1; i < len; i++) {
          virtualItems[i - 1] = virtualItems[i];
        }
        virtualItems.length = len - 1;
      }

      function renderChild(item: T, index: number = virtualItems.length) {
        var executeContext: VirtualItem = {
          bindings: [],
          subscriptions: [],
          data: item as any,
          elements: [],
          push: sharedEventHandler,
          get nextSibling() {
            const { elements } = this;
            if (elements.length) {
              const last = elements[elements.length - 1];
              return last.nextSibling;
            }
            return null;
          },
          get lastElement() {
            const { elements } = this;
            if (elements.length) {
              const last = elements[elements.length - 1];
              return last;
            }
            return null;
          },
          get firstElement() {
            const { elements } = this;
            if (elements.length) {
              const first = elements[0];
              return first;
            }
            return null;
          },
        };

        let insertBeforeElt: HTMLElement | null = null;
        if (index < virtualItems.length) {
          virtualItems.splice(index, 0, executeContext);
          for (let i = index + 1; i < virtualItems.length; i++) {
            const next = virtualItems[i];
            if (next.elements.length) {
              insertBeforeElt = next.elements[0];
              break;
            }
          }
        } else virtualItems.push(executeContext);

        for (const child of children) {
          if (child instanceof JsxElement) {
            const root = child.templateNode.cloneNode(true) as HTMLElement;
            executeContext.elements.push(root);
            execute(child.content, root, executeContext);

            if (insertBeforeElt) target.insertBefore(root, insertBeforeElt);
            else target.appendChild(root);
          }
        }
      }

      function renderChildren(source: ArrayLike<T>) {
        for (let i = 0, length = source.length; i < length; i++) {
          var executeContext: VirtualItem = {
            bindings: [],
            subscriptions: [],
            data: source[i] as any,
            elements: [],
            push: sharedEventHandler,
            get nextSibling() {
              const { elements } = this;
              if (elements.length) {
                const last = elements[elements.length - 1];
                return last.nextSibling;
              }
              return null;
            },
            get lastElement() {
              const { elements } = this;
              if (elements.length) {
                const last = elements[elements.length - 1];
                return last;
              }
              return null;
            },
            get firstElement() {
              const { elements } = this;
              if (elements.length) {
                const first = elements[0];
                return first;
              }
              return null;
            },
          };

          virtualItems.push(executeContext);

          for (const child of children) {
            if (child instanceof JsxElement) {
              const root = child.templateNode.cloneNode(true) as HTMLElement;
              executeContext.elements.push(root);
              execute(child.content, root, executeContext);
              target.appendChild(root);
            }
          }

          // data.subscribe({
          //   executeContext,
          //   next() {
          //     const virtualItem = this.executeContext;

          //     let i = 0;
          //     for (const child of children) {
          //       if (child instanceof JsxElement) {
          //         const root = virtualItem.elements[i++];
          //         execute(child.updates, root, virtualItem);
          //       }
          //     }
          //   },
          // });
        }
      }
    },
  };
}

interface VirtualItem extends ExecuteContext<Record<any, any>> {
  elements: HTMLElement[];
  nextSibling: Node | null;
  firstElement: HTMLElement | null;
  lastElement: HTMLElement | null;
}

// function reconcileArrays(
//   parentNode: RenderTarget,
//   a: VirtualItem[],
//   b: VirtualItem[]
// ) {
//   function insertBefore(vi: VirtualItem, node: ChildNode | null) {
//     for (const elt of vi.elements) {
//       parentNode.insertBefore(elt, node);
//     }
//   }

//   function remove(vi: VirtualItem) {
//     for (const binding of vi.bindings) {
//       binding.dispose();
//     }
//     for (const subscription of vi.subscriptions) {
//       subscription.unsubscribe();
//     }
//     for (const elt of vi.elements) {
//       elt.remove();
//     }
//   }

//   function replaceChild(vx: VirtualItem, vy: VirtualItem) {
//     const x = vx.elements;
//     const y = vy.elements;
//     for (
//       let i = 0, len = x.length > y.length ? y.length : x.length;
//       i < len;
//       i++
//     ) {}
//     console.log(vx, vy);
//   }

//   let bLength = b.length,
//     aEnd = a.length,
//     bEnd = bLength,
//     aStart = 0,
//     bStart = 0,
//     after = a[aEnd - 1].nextSibling,
//     map = null;
//   while (aStart < aEnd || bStart < bEnd) {
//     if (a[aStart] === b[bStart]) {
//       aStart++;
//       bStart++;
//       continue;
//     }
//     while (a[aEnd - 1] === b[bEnd - 1]) {
//       aEnd--;
//       bEnd--;
//     }
//     if (aEnd === aStart) {
//       const node =
//         bEnd < bLength
//           ? bStart
//             ? b[bStart - 1].nextSibling
//             : b[bEnd - bStart].firstElement
//           : after;
//       while (bStart < bEnd) insertBefore(b[bStart++], node);
//     } else if (bEnd === bStart) {
//       while (aStart < aEnd) {
//         if (!map || !map.has(a[aStart])) remove(a[aStart]);
//         aStart++;
//       }
//     } else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
//       const node = a[--aEnd].nextSibling;
//       insertBefore(b[bStart++], a[aStart++].nextSibling);
//       insertBefore(b[--bEnd], node);
//       a[aEnd] = b[bEnd];
//     } else {
//       if (!map) {
//         map = new Map();
//         let i = bStart;
//         while (i < bEnd) map.set(b[i], i++);
//       }
//       const index = map.get(a[aStart]);
//       if (index != null) {
//         if (bStart < index && index < bEnd) {
//           let i = aStart,
//             sequence = 1,
//             t;
//           while (++i < aEnd && i < bEnd) {
//             if ((t = map.get(a[i])) == null || t !== index + sequence) break;
//             sequence++;
//           }
//           if (sequence > index - bStart) {
//             const node = a[aStart].firstElement;
//             while (bStart < index) insertBefore(b[bStart++], node);
//           } else replaceChild(b[bStart++], a[aStart++]);
//         } else aStart++;
//       } else remove(a[aStart++]);
//     }
//   }
// }
