import { RenderContext } from './render-context';
import { RenderTarget } from './render-target';

export * from './render-target';
export * from './render-context';

export class RenderResult {
  readonly nodes: Node[] = [];

  constructor(public values: any) {}

  dispose() {
    const { nodes } = this;

    for (const elt of nodes) {
      (elt as any).remove();
    }
  }
}

export interface Renderable {
  render(target: RenderTarget, context?: RenderContext): RenderResult | void;
}
