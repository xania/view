import {
  AnchorTemplateNode,
  TagTemplateNode,
  TextTemplateNode,
} from '../jsx/template-node';

export function createHTMLElement(node: TagTemplateNode): HTMLElement {
  const htmlElement = document.createElement(node.name);

  for (const cl of node.classList) {
    htmlElement.classList.add(cl);
  }

  for (const attrName in node.attrs) {
    htmlElement.setAttribute(attrName, node.attrs[attrName]);
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
    if (child instanceof TagTemplateNode) {
      htmlElement.appendChild(createHTMLElement(child));
    } else if (child instanceof TextTemplateNode) {
      const textNode = document.createTextNode(child.data);
      htmlElement.appendChild(textNode);
    } else if (child instanceof AnchorTemplateNode) {
      const comment = document.createComment('anchor: ' + child.label);
      htmlElement.appendChild(comment);
    } else {
      console.error('not supported', child);
    }
  }

  return htmlElement;
}
