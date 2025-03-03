import { DomDescriptorType, isDomDescriptor } from '../intrinsic';
import { State, Signal, Value, Composed } from './signal';

console.log({} instanceof State);

export function render<TElement>(
  view: any,
  root: TElement,
  nodeFactory: ViewNodeFactory<TElement>
): Promise<Sandbox<TElement>> | Sandbox<TElement> {
  const sandbox = new Sandbox(root);

  if (view === undefined || view === null) {
    return sandbox;
  }

  const viewStack = [view];

  const containerStack: TElement[] = [];
  let container = root;

  const retval = loop();
  if (retval instanceof Promise) {
    return retval.then(() => sandbox);
  } else {
    return sandbox;
  }

  function loop(): void | Promise<void> {
    while (viewStack.length) {
      const curr = viewStack.pop()!;
      if (curr === null || curr === undefined) {
        continue;
      } else if (curr instanceof Promise) {
        return curr.then((resolved) => {
          viewStack.push(resolved);
          return loop();
        });
      } else if (curr === popContainer) {
        container = containerStack.pop()!;
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
      } else if (curr instanceof Signal) {
        const initial = sandbox.register(curr);
        const textNode = nodeFactory.appendText(container, initial);
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
      }
    }
  }
}

const popContainer = Symbol();

export interface ITextNode {
  nodeValue: string | String | number | Number | null;
}

interface ViewNodeFactory<TElement> {
  appendElement(
    container: TElement,
    name: string,
    attrs: Record<string, any> | undefined
  ): TElement;
  appendText(container: TElement, content: ITextNode['nodeValue']): ITextNode;
}

class Sandbox<TElement> {
  private values: Record<symbol, any> = {};
  private updates: Record<symbol, Program> = {};

  constructor(public root: TElement) {}

  update<T>(state: State<T>, newValue: T) {
    console.log(state, newValue);
  }

  register<T>(signal: Signal<T>): Value<T> {
    let value: any = undefined;

    const queue: Signal<T>[] = [signal];

    for (let i = 0; i < queue.length; i++) {
      const curr = queue[i];
      const { key } = curr;

      if (curr instanceof State) {
        value = curr.initial;
        this.values[key] = value;
      } else if (curr instanceof Composed) {
        queue.push(...curr.signals);
      } else {
        throw new Error('Not Yet Supported');
      }
    }

    return value;
  }
}

type Program = Instruction[];

type Instruction = Signal;
