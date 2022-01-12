import {
  AttributeType,
  Renderable,
  RenderResult,
  Template,
  TemplateType,
} from './template';

export interface RenderTarget {
  addEventListener(event: string, handler: EventHandler): void;
  setAttribute(name: string, value: string): void;
  namespaceURI: string | null;
  removeChild(node: Node): void;
  appendChild(node: Node): void;
}

export type EventHandler = { handleEvent(): void };

export function render(
  root: RenderTarget,
  children: Template | Template[]
  // args?: any[]
) {
  const stack: [RenderTarget, Template][] = [];
  const disposables: ReturnType<Renderable['render']>[] = [];

  if (Array.isArray(children)) {
    let { length } = children;
    for (let i = length - 1; i >= 0; i--) {
      stack.push([root, children[i]]);
    }
  } else {
    stack.push([root, children]);
  }

  let curr;
  while ((curr = stack.pop())) {
    const [target, child] = curr;

    switch (child.type) {
      case TemplateType.Tag:
        const { attrs, children } = child;
        const tag = createDOMElement(target.namespaceURI, child.name);
        if (attrs) {
          for (const attr of attrs) {
            if (attr.type === AttributeType.Attribute) {
              tag.setAttribute(attr.name, attr.value);
            } else if (attr.type === AttributeType.Event) {
              tag.addEventListener(attr.event, {
                handleEvent() {
                  attr.handler();
                },
              });
            }
          }
        }

        let { length } = children;
        target.appendChild(tag);
        for (let i = length - 1; i >= 0; i--) {
          stack.push([tag, children[i]]);
        }

        if (target === root) {
          disposables.push(RenderResult.create(tag));
        }

        break;

      case TemplateType.Text:
        const textNode = document.createTextNode(child.value);
        target.appendChild(textNode);
        if (target === root) {
          disposables.push(RenderResult.create(textNode));
        }
        break;

      case TemplateType.Subscribable:
        const subscribableNode = document.createTextNode('');
        target.appendChild(subscribableNode);
        const subcr = child.value.subscribe({
          next(value) {
            subscribableNode.textContent = value;
          },
        });
        disposables.push(RenderResult.create(null, subcr));
        break;

      case TemplateType.Disposable:
        disposables.push(RenderResult.create(null, child));
        break;
      case TemplateType.DOM:
        target.appendChild(child.node);
        break;
      case TemplateType.Renderable:
        addDisposables(child.renderer.render({ target }));
        break;
    }
  }

  function addDisposables(result: ReturnType<Renderable['render']>) {
    if (result) {
      disposables.push(result);
    }
  }
  return disposables;
}

export function createDOMElement(namespaceURI: string | null, name: string) {
  return document.createElementNS(
    name === 'svg' ? 'http://www.w3.org/2000/svg' : namespaceURI,
    name
  );
}
