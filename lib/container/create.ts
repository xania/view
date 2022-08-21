import { Template } from '../template';

import { ViewMutationManager, ContainerMutationType } from './mutation';
import { RenderTarget } from '../renderable/render-target';
import { ViewBinding } from '../compile/binding';
import { View } from './view';

export function createView<T>(itemTemplate: Template): View<T> {
  const mutations = new ViewMutationManager<T>();
  return {
    render(target: RenderTarget) {
      const binding = new ViewBinding(itemTemplate, target);
      const ss = mutations.subscribe(binding);

      return {
        dispose() {
          ss.unsubscribe();
        },
      };
    },
    dispose() {
      mutations.dispose();
    },
    clear(): void {
      // vdata.length = 0;
      mutations.pushMutation({
        type: ContainerMutationType.CLEAR,
      });
    },
    removeAt(index: number): void {
      if (index >= 0) {
        mutations.pushMutation({
          type: ContainerMutationType.REMOVE_AT,
          index,
        });
      }
    },
    swap(index1: number, index2: number) {
      mutations.pushMutation({
        type: ContainerMutationType.SWAP,
        index1,
        index2,
      });
    },
    update(data: any[]) {
      mutations.pushMutation({
        type: ContainerMutationType.RENDER,
        data,
      });
    },
    move(from: number, to: number) {
      mutations.pushMutation({
        type: ContainerMutationType.MOVE,
        from,
        to,
      });
    },
  } as any;
}
