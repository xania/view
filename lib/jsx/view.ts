import { ViewBinding } from '../binding';
import { ViewMutation, ViewMutationType } from '../mutation';
import { RenderTarget } from './renderable';
import { Template } from './template';

export function createView<T>(itemTemplate: Template, init?: T[]): View<T> {
  return new View<T>(itemTemplate, init);
}

export class View<T> {
  private bindings: ViewBinding[] = [];

  constructor(private itemTemplate: Template, private init?: T[]) {}

  pushMutation = (mut: ViewMutation<T>) => {
    if (!mut) return;
    const { bindings } = this;
    let { length } = bindings;
    while (length--) {
      const observer = bindings[length];
      observer.next(mut);
    }
  };

  render(target: RenderTarget) {
    const { init, itemTemplate, bindings } = this;
    const binding = new ViewBinding(itemTemplate, target);
    bindings.push(binding);
    if (init instanceof Array)
      binding.next({
        type: ViewMutationType.RENDER,
        data: init,
      });

    return {
      dispose() {
        const idx = bindings.indexOf(binding);
        if (idx >= 0) {
          bindings.splice(idx, 1);
        }
      },
    };
  }

  dispose() {
    throw new Error('Method not implemented.');
  }

  clear(): void {
    this.pushMutation({
      type: ViewMutationType.CLEAR,
    });
  }
  removeAt(index: number): void {
    if (index >= 0) {
      this.pushMutation({
        type: ViewMutationType.REMOVE_AT,
        index,
      });
    }
  }
  swap(index1: number, index2: number) {
    this.pushMutation({
      type: ViewMutationType.SWAP,
      index1,
      index2,
    });
  }

  update(data: T[]) {
    this.pushMutation({
      type: ViewMutationType.RENDER,
      data,
    });
  }
  move(from: number, to: number) {
    this.pushMutation({
      type: ViewMutationType.MOVE,
      from,
      to,
    });
  }
}
