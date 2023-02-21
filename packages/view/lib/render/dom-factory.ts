import { RenderTarget, XHTMLElement } from '../jsx/renderable';
import { TagTemplateNode } from '../jsx/template-node';

export interface IDomFactory<T extends XHTMLElement = HTMLElement> {
  appendAnchor(target: RenderTarget<T>, text: string): void;
  appendTag(target: RenderTarget<T>, tag: TagTemplateNode): T;
}
