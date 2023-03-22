import { Template, templateBind } from '../tpl';
import { DomDescriptorType, isDomDescriptor } from '../intrinsic/descriptors';
import type { Disposable } from '../disposable';
import { applyAttributes, applyEvents, renderStatic } from './render-node';
import { Program, View } from '../compile/program';
import type { RenderTarget } from './target';
import { RenderContext } from './render-context';
import { DomFactory } from './dom-factory';
import { isAttachable } from './attachable';
import { isViewable } from './viewable';
import { Graph, Scope } from '../reactive';
import { resolve } from '../utils/resolve';

export function render(
  rootChildren: JSX.Element,
  rootTarget: RenderTarget,
  domFactory: DomFactory = document
): Template<Node | View | Disposable> {
  const scope = new Scope();
  const graph = new Graph();

  const context: RenderContext = new RenderContext(scope, graph);
  function binder(
    value: JSX.Value,
    currentTarget: RenderTarget
  ): Template<Node | View | Disposable> {
    if (value instanceof Node) {
      currentTarget.appendChild(value.cloneNode(true));
      return value;
    } else if (value instanceof Program) {
      const view = value.attachTo(currentTarget, domFactory);
      return [view, view.render()];
    } else if (isDomDescriptor(value)) {
      switch (value.type) {
        case DomDescriptorType.StaticElement:
          const staticNode = renderStatic(value, domFactory);
          currentTarget.appendChild(staticNode);
          return staticNode;
        case DomDescriptorType.Element:
          const elementNode = domFactory.createElement(value.name);
          if (value.attrs) {
            applyAttributes(elementNode, value.attrs);
          }
          currentTarget.appendChild(elementNode);
          /** wrap promise inside an array (or any object) to render children concurrently */
          return [
            elementNode,
            templateBind(value.children, binder, elementNode),
            applyEvents(value.events, elementNode, context),
          ];
        case DomDescriptorType.Text:
          const textNode = domFactory.createTextNode(value.text);
          currentTarget.appendChild(textNode);
          return textNode;
        case DomDescriptorType.Data:
          const dataNode = domFactory.createTextNode(value.data.toString());
          currentTarget.appendChild(dataNode);
          return dataNode;
      }
    } else if (isAttachable(value)) {
      return value.attachTo(currentTarget, domFactory);
    } else if (isViewable(value)) {
      const view = value.view();
      return templateBind(view, binder, currentTarget);
    } else if (typeof value === 'string') {
      const textNode = domFactory.createTextNode(value);
      currentTarget.appendChild(textNode);
      return textNode;
    } else if (typeof value === 'number') {
      const textNode = domFactory.createTextNode(String(value));
      currentTarget.appendChild(textNode);
      return textNode;
    } else {
      return resolve(value.initial, (initial) => {
        const textNode = domFactory.createTextNode(String(initial));
        currentTarget.appendChild(textNode);

        context.graph.add(value);
        context.graph.connect(value, {
          type: 'text',
          text: textNode,
        });

        return textNode;
      });
    }
  }

  return templateBind(rootChildren, binder, rootTarget);
}

export * from './unrender';
export * from './ready';
export * from './dom-factory';
export * from './viewable';
export * from './attachable';
