import { DomDescriptorType, isDomDescriptor } from '../intrinsic';
import { State } from './signal';

console.log({} instanceof State);

export function render<TElement>(
  view: any,
  root: TElement,
  nodeFactory: ViewNodeFactory<TElement>
) {
  if (view === undefined || view === null) {
    return '';
  }

  const viewStack = [view];

  const containerStack = [];
  let container = root;

  while (viewStack.length) {
    const curr = viewStack.pop()!;
    if (curr === popContainer) {
      container = containerStack.pop()!;
    } else if (isDomDescriptor(curr)) {
      switch (curr.type) {
        case DomDescriptorType.Element:
          const { children, attrs } = curr;
          const element = nodeFactory.appendElement(
            container,
            curr.name,
            attrs
          );
          if (
            children !== null &&
            children !== undefined &&
            children.length > 0
          ) {
            containerStack.push(container);
            container = element;

            viewStack.push(popContainer);

            for (let i = children.length - 1; i >= 0; i--) {
              const item = children[i];
              if (item !== null && item !== undefined) {
                viewStack.push(item);
              }
            }
          }
          break;
      }
    } else if (curr.constructor === String) {
      nodeFactory.appendText(container, curr);
    } else if (curr.constructor === Number) {
      nodeFactory.appendText(container, curr);
    } else if (curr.constructor === Array) {
      for (let i = curr.length - 1; i >= 0; i--) {
        const item = curr[i];
        if (item !== null && item !== undefined) {
          viewStack.push(item);
        }
      }
    } else if (curr instanceof State) {
      const { initial } = curr;
      if (initial !== null && initial !== undefined) {
        viewStack.push(initial);
      }
    }
  }
}

const popContainer = Symbol();

interface ViewNodeFactory<TElement> {
  appendElement(
    container: TElement,
    name: string,
    attrs: Record<string, any> | undefined
  ): TElement;
  appendText(
    container: TElement,
    content: string | String | number | Number
  ): void;
}
