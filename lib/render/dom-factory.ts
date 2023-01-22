import { RenderTarget } from '../jsx/renderable';
import { TagTemplateNode } from '../jsx/template-node';

export interface IDomFactory {
  appendAnchor(target: RenderTarget, text: string): number;
  appendTag(target: RenderTarget, tag: TagTemplateNode): HTMLElement;
}
