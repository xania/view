import { Disposable } from '../disposable';
import { Renderable, RenderTarget } from '../jsx';
import { Subscribable } from 'rxjs';

export interface ObserveProps {
  state: Subscribable<any>;
}

export function Observe(props: ObserveProps, children: Renderable[]) {
  return {
    render(target: RenderTarget) {
      const { state } = props;
      let bindings: Disposable[];
      var sub = state.subscribe({
        next() {
          for (const child of children.map((x) => x.render(target))) {
            bindings.push(child);
          }
        },
      });

      return {
        dispose() {
          sub.unsubscribe();
          bindings.map((x) => x.dispose());
        },
      };
    },
  };
}
