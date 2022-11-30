import { RenderTarget } from '../jsx/renderable';
import { render } from '../render/index';

export function view(tpl: any) {
  return {
    render(target: RenderTarget) {
      return render(tpl, target);
    },
  };
}
