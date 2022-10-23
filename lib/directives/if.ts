import { Disposable } from 'lib/disposable';
import { Renderable, RenderTarget } from 'lib/jsx';
import { State } from 'lib/state';

export interface IfProps {
  condition: State<boolean>;
}

export function If(props: IfProps, children: Renderable[]) {
  return {
    render(target: RenderTarget) {
      const { condition } = props;
      let bindings: Disposable[];
      var sub = condition.subscribe({
        next(b) {
          if (b) {
            bindings = children.map((x) => x.render(target));
          } else {
            bindings.map((x) => x.dispose());
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