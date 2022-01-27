import { Disposable } from '../abstractions/disposable';
import { RenderContext } from './render-context';
import { RenderTarget } from './render-target';

export * from './render-target';
export * from './render-context';

type RenderResultItem = RXJS.Unsubscribable | Disposable;
export class RenderResult {
  // readonly items: RenderResultItem[] = [];
  readonly nodes: Node[] = [];

  constructor(public values: any) {}

  static create(
    node: Node | null,
    ...results: (RenderResultItem | null | undefined | void)[]
  ) {
    var result = new RenderResult(null);
    const { nodes } = result;

    for (const x of results) {
      if (x) {
        // items.push(x);
      }
    }

    if (node) nodes.push(node);

    return result;
  }

  dispose() {
    const { nodes } = this;
    // for (const item of items) {
    //   if ('dispose' in item) item.dispose();
    //   if ('unsubscribe' in item) item.unsubscribe();
    // }

    for (const elt of nodes) {
      (elt as any).remove();
    }

    //    items.length = 0;
  }
}

export interface Renderable {
  render(target: RenderTarget, context?: RenderContext): RenderResult | void;
}
