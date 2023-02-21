import { render } from '.';
import { disposeAll } from '../disposable';
import { Anchor, RenderTarget } from '../jsx';
import { JsxElement } from '../jsx/element';
import { isSubscribable } from '../jsx/observables';
import { IDomFactory } from './dom-factory';

export function view(tpl: any): any {
  if (tpl instanceof JsxElement) {
    return tpl;
  } else if (tpl instanceof Promise) {
    return {
      render(target: RenderTarget, domFactory: IDomFactory) {
        return tpl.then((resolved) =>
          render(view(resolved), target, domFactory)
        );
      },
    };
  } else if (isSubscribable(tpl)) {
    return {
      observable: tpl,
      render(target: HTMLElement | Anchor) {
        const observable: JSX.Observable<any> = tpl;
        return observable.subscribe({
          bindings: null,
          next(tpl) {
            const { bindings } = this;
            if (bindings) {
              disposeAll(bindings);
            }
            this.bindings = render(tpl, target);
          },
        });
        // return render(tpl, target);
      },
    };
  }
  console.log('\u001b[' + 31 + 'm' + 'not yet supported' + '\u001b[0m');
  console.error(tpl);
  // return 'view';
}
