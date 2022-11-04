﻿import { Disposable } from '../disposable';
import { createView, RenderTarget, View } from '../jsx';
import { Subscribable } from '../util/is-subscibable';

export interface ListProps<T> {
  data: Subscribable<T[]>;
}
export function List<T>(props: ListProps<T>, children: any[]) {
  return {
    render(target: RenderTarget) {
      const views: View<T>[] = [];
      const bindings: Disposable[] = [];
      for (const child of children) {
        const view = createView<T>(child, []);
        const binding = view.render(target);
        views.push(view);
        bindings.push(binding);
      }

      const subscription = props.data.subscribe({
        next(rows: T[]) {
          for (const view of views) {
            view.update(rows);
          }
        },
      });

      return {
        dispose() {
          subscription?.unsubscribe();
          for (const b of bindings) {
            b.dispose();
          }
        },
      };
    },
  };
}