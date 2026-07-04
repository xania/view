import {
  Automaton,
  AutomatonObject,
  AutomatonTarget,
  ITextNode,
  Lense,
  RootScope,
  Scope,
  events,
} from '@xania/reactivity';
import { InstructionEnum, Program } from '@xania/reactivity/program';

export type ObjectEvents = Record<string, Function>;

type WebElement = HTMLElement & {
  [events]?: ObjectEvents;
};

export class DomAutomaton implements Automaton {
  public currentTarget: AutomatonTarget;

  constructor(
    rootOutput: HTMLElement,
    public scope: Scope = RootScope
  ) {
    this.currentTarget = {
      output: rootOutput,
      traversal: [],
      patches: (scope.patches ??= new Map()),
      scope,
    };
  }

  appendArray(): AutomatonTarget | void {
    const { currentTarget } = this;

    if (currentTarget.output instanceof HTMLElement) {
    } else {
      throw new Error('Method not implemented.');
    }
  }

  appendObject(type?: string): AutomatonTarget {
    if (!type) {
      throw new Error('Object type is required.');
    }

    const { currentTarget } = this;
    if (!(currentTarget.output instanceof HTMLElement)) {
      throw new Error('Current target output is not an HTMLElement.');
    }

    if (currentTarget.prop) {
      throw new Error('Cannot append object to a property of an HTMLElement.');
    }

    const newObject: WebElement = document.createElement(type);

    return {
      output: newObject,
      traversal: this.append(currentTarget.output, newObject) ?? [],
      scope: currentTarget.scope,
    };
  }
  appendText(content: ITextNode['nodeValue']): void {
    const { currentTarget } = this;
    if (currentTarget.output instanceof HTMLElement) {
      if (currentTarget.prop) {
        currentTarget.output.setAttribute(currentTarget.prop, String(content));
      } else {
        const textNode = document.createTextNode(String(content));
        currentTarget.output.appendChild(textNode);
      }
    } else {
      throw new Error('Cannot append text to the current target output.');
    }
  }

  appendValue<T>(lense: Lense<any>, stateValue?: T): void {
    throw new Error('Method not implemented.');
  }
  pushRegion(visible?: boolean | void | undefined): AutomatonTarget {
    throw new Error('Method not implemented.');
  }
  pushTemplate(): AutomatonTarget {
    throw new Error('Method not implemented.');
  }

  private append(output: HTMLElement, newObject: WebElement): Program | void {
    output.appendChild(newObject);
    return [
      {
        type: InstructionEnum.PushIndex,
        index: output.childNodes.length - 1,
      },
    ];
  }
}
