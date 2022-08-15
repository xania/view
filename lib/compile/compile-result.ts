import { addEventDelegation } from './event-delegation';
import { RenderTarget } from '../renderable/render-target';
import { NodeCustomization } from './helpers';
import { execute } from './execute';

export interface CompileResult {
  listen(targetElement: RenderTarget): void;
  render(targetElement: RenderTarget, items: ArrayLike<any>): RenderTarget[];
}

export class NodeCompileResult implements CompileResult {
  constructor(public customization: NodeCustomization) {}

  listen(targetElement: RenderTarget) {
    addEventDelegation(targetElement, this.customization);
  }

  render(targetElement: RenderTarget, items: ArrayLike<any>) {
    const { customization: cust } = this;
    const rootNodes = cust.nodes;
    execute(cust.render, items, {
      target: targetElement,
      cust: this.customization,
    });
    return rootNodes;
  }
}
