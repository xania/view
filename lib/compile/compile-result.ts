import { RenderTarget } from '../renderable';
import { NodeCustomization } from './helpers';
import { ViewBinding } from './binding';

export default class CompileResult {
  constructor(public customization: NodeCustomization) {}

  render(target: RenderTarget) {
    return new ViewBinding(this, target);
  }
}
