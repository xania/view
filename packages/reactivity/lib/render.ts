// import { DomDescriptorType, isDomDescriptor } from '../intrinsic';
import {
  Automaton,
  ITextNode,
  popScope,
  SetProperty,
  TextNodeUpdater,
} from './automaton';
import { Conditional } from './core/if';
import { Iterator } from './core/for';
import { Sandbox } from './sandbox';
import { State } from './state';

export function render(
  view: any,
  automaton: Automaton
): Promise<Sandbox> | Sandbox {
  const sandbox = new Sandbox();

  if (view === undefined || view === null) {
    return sandbox;
  }

  const viewStack = [view];

  const objectsStack: { property?: string }[] = [];
  let currentObject: (typeof objectsStack)[number] | undefined = undefined;

  const promises: Promise<void>[] = [];
  const retval = loop();

  if (retval instanceof Promise) {
    promises.push(retval);
  }

  if (promises.length) {
    return Promise.all(promises).then(() => sandbox);
  } else {
    return sandbox;
  }

  function loop(): void | Promise<void> {
    while (viewStack.length) {
      const curr = viewStack.pop()!;
      if (curr === null || curr === undefined) {
        continue;
      }

      if (curr instanceof Promise) {
        return curr.then((resolved) => {
          viewStack.push(resolved);
          return loop();
        });
      }

      if (curr.constructor === String) {
        const node = automaton.appendText(curr, currentObject?.property);
      } else if (curr.constructor === Number) {
        const node = automaton.appendText(curr, currentObject?.property);
      } else if (curr.constructor === Conditional) {
        const { initial } = curr.expr;

        const region = automaton.pushRegion(false, currentObject?.property);
        sandbox.bindConditional(curr.expr, region);

        viewStack.push(new InitializeState(curr.expr));
        viewStack.push(popScope);
        viewStack.push(curr.body);
      } else if (curr.constructor === Iterator) {
        const { expr } = curr;
        const tpl = automaton.pushTemplate(currentObject?.property);
        viewStack.push(new InitializeState(expr));
        viewStack.push(popScope);
        viewStack.push(curr.body);
        sandbox.bindIterator(curr, tpl);
      } else if (curr instanceof State) {
        const textNode = automaton.appendText('', currentObject?.property);
        const res = sandbox.bindTextNode(curr, textNode);
        if (res) {
          promises.push(res);
        }
      } else if (curr instanceof SelectProperty) {
        if (currentObject) {
          currentObject.property = curr.property;
        }
      } else if (curr instanceof InitializeState) {
        sandbox.update(curr.expr, curr.expr.initial);
      } else if (curr === popScope) {
        automaton.up();
      } else if (curr === popCurrentObject) {
        currentObject = objectsStack.pop();
      } else if (curr.constructor === Array) {
        automaton.appendArray(currentObject?.property);
        viewStack.push(popScope);

        if (currentObject) {
          objectsStack.push(currentObject);
        }
        currentObject = undefined;
        viewStack.push(popCurrentObject);

        for (let i = curr.length - 1; i >= 0; i--) {
          const item = curr[i];
          if (item !== null && item !== undefined) {
            viewStack.push(item);
          }
        }
      } else {
        automaton.appendObject(currentObject?.property);
        viewStack.push(popScope);

        if (currentObject) {
          objectsStack.push(currentObject);
        }
        currentObject = {};

        viewStack.push(popCurrentObject);

        for (const prop in curr) {
          const propValue = curr[prop];
          viewStack.push(propValue);
          viewStack.push(new SelectProperty(prop));
        }

        // if (currentContainer) {
        //   debugger;
        // }
        // if (
        //   children !== null &&
        //   children !== undefined &&
        //   children.length > 0
        // ) {
        //   if (currentContainer) {
        //     currentContainer.counter++;
        //     viewStack.push(decrementContainer);
        //   }

        //   for (let i = children.length - 1; i >= 0; i--) {
        //     const item = children[i];
        //     if (item !== null && item !== undefined) {
        //       viewStack.push(item);
        //     }
        //   }
        // }
      }
    }
  }
}

interface ContainerItem {}
class Container {
  public counter: number = 0;
  public items: ContainerItem[] = [];
  push(item: ContainerItem): void {
    if (this.counter == 0) {
      this.items.push(item);
    }
  }
}

const popCurrentObject = Symbol('pop-current-object');

// class FragmentAutomaton implements Automaton {
//   depth: number = 0;

//   constructor(public parent: Automaton) {}

//   up(): void {
//     this.depth--;
//     this.parent.up();
//   }
//   appendElement(child: any): Record<any, any> | Array<any> {
//     this.depth++;
//     return this.parent.appendElement(child);
//   }
//   appendText(content?: ITextNode['nodeValue']): ITextNode | TextNodeUpdater {
//     return this.parent.appendText(content);
//   }
// }

// class PropertyAutomaton implements Automaton {
//   constructor(
//     public parent: Automaton,
//     public propertyName: string
//   ) {}

//   up(): void {
//     this.parent.up();
//   }
//   appendElement(child: any): Record<any, any> | Array<any> {
//     return this.parent.appendElement(child);
//   }
//   appendText(content?: ITextNode['nodeValue']): ITextNode | TextNodeUpdater {
//     return this.parent.appendText(content);
//   }
// }

class SelectProperty {
  constructor(public property: string) {}
}

class InitializeState {
  constructor(public expr: State<any>) {}
}
