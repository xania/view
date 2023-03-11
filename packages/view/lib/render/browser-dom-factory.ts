import { IDomFactory } from './dom-factory';
import { TagTemplateNode, TemplateNodeType } from '../jsx/template-node';
import { Anchor, RenderTarget } from '../jsx/renderable';

export class BrowserDomFactory implements IDomFactory<HTMLElement> {
  constructor() {}

  appendAnchor(target: RenderTarget<HTMLElement>, text: string): void {
    const container = target instanceof Anchor ? target.container : target;
    const anchor = document.createComment(text);
    container.appendChild(anchor);
  }

  appendText(target: RenderTarget<HTMLElement>, text: string): void {
    const textNode = document.createTextNode(text);
    if (target instanceof Anchor) {
      const { container } = target;
      container.insertBefore(textNode, target.child as Node);
    } else {
      target.appendChild(textNode);
    }
  }

  appendTag(target: RenderTarget<HTMLElement>, tag: TagTemplateNode) {
    const root = createHTMLElement(tag);
    if (target instanceof Anchor) {
      const { container } = target;
      container.insertBefore(root, target.child as Node);
    } else {
      target.appendChild(root);
    }
    return root;
  }
}

export function createHTMLElement(node: TagTemplateNode): HTMLElement {
  const htmlElement = document.createElement(node.name);

  for (const cl of node.classList) {
    htmlElement.classList.add(cl);
  }

  for (const attrName in node.attrs) {
    (htmlElement as any)[attrName] = node.attrs[attrName];
    // htmlElement.setAttribute(attrName, node.attrs[attrName]);
  }

  /** seems like textContent is slower than creating textnode and calling appendChild */
  // if (
  //   node.childNodes.length === 1 &&
  //   node.childNodes[0] instanceof TextTemplateNode
  // ) {
  //   const singleTextChild = node.childNodes[0];
  //   htmlElement.textContent = singleTextChild.data;
  // } else
  for (const child of node.childNodes) {
    switch (child.type) {
      case TemplateNodeType.Tag:
        htmlElement.appendChild(createHTMLElement(child));
        break;
      case TemplateNodeType.Text:
        const textNode = document.createTextNode(child.data);
        htmlElement.appendChild(textNode);
        break;
      case TemplateNodeType.Anchor:
        const comment = document.createComment('anchor: ' + child.label);
        htmlElement.appendChild(comment);
        break;
      default:
        console.error('not supported', child);
        break;
    }
  }

  return htmlElement;
}
