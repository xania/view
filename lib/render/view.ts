import { RenderTarget } from '../jsx/renderable';
import { render } from './index';

export function view(tpl: any) {
  return {
    render(target: RenderTarget) {
      return render(tpl, target);
    },
  };
}
