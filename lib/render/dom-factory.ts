import { RenderTarget } from '../jsx/renderable';
import { TagTemplateNode } from '../jsx/template-node';

export interface IDomFactory<T> {
  appendAnchor(target: RenderTarget<T>, text: string): void;
  appendTag(target: RenderTarget<T>, tag: TagTemplateNode): T;
}
