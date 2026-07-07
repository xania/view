import {
  Automaton,
  AutomatonTarget,
  AutomatonTemplate,
  ITextNode,
  Lense,
  RootScope,
  Scope,
  State,
  appendStateRead,
  events,
  resolveRootState,
} from '@xania/reactivity';
import {
  Instruction,
  InstructionEnum,
  Program,
} from '@xania/reactivity/program';

export type ObjectEvents = Record<string, Function>;

type WebElement = HTMLElement & {
  [events]?: ObjectEvents;
  childNodes: NodeListOf<ChildNode>;
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

    const newObject: WebElement = document.createElement(type);

    return {
      output: newObject,
      traversal: this.append(newObject) ?? [],
      scope: this.currentTarget.scope,
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

  appendValue<T>(stateValue?: T): Program | void {
    const { currentTarget } = this;
    if (currentTarget.output instanceof HTMLElement) {
      if (currentTarget.prop) {
        currentTarget.output.setAttribute(
          currentTarget.prop,
          String(stateValue)
        );
      } else {
        const textNode = document.createTextNode(String(stateValue));
        currentTarget.output.appendChild(textNode);
      }
    } else {
      debugger;
    }
  }

  pushConditional(lense: Lense<any>, stateValue: any): AutomatonTarget {
    const { currentTarget } = this;
    if (!(currentTarget.output instanceof HTMLElement)) {
      throw Error('output is not an array');
    }

    const conditional = new AutomatonConditional(
      currentTarget.output,
      lense,
      stateValue
    );
    const state = resolveRootState(lense);

    return {
      output: conditional,
      traversal: [
        {
          type: InstructionEnum.PushOutput,
          output: conditional.fragment,
        },
      ],
      scope: currentTarget.scope,
      patches: new Map<State, Program>([
        [
          state,
          (() => {
            const program = appendStateRead(lense, []);
            program.push({
              type: InstructionEnum.Show,
              node: conditional,
            } as Instruction);
            return program;
          })(),
        ],
      ]),
    };
  }
  pushRegion(visible?: boolean | void | undefined): AutomatonTarget {
    throw new Error('Method not implemented.');
  }
  pushTemplate(): AutomatonTarget {
    const { currentTarget } = this;
    if (!(currentTarget.output instanceof HTMLElement)) {
      throw Error('output is not an array');
    }

    const childScope = currentTarget.scope.pushScope();

    const tpl = new AutomatonTemplate(
      childScope,
      currentTarget.output.childNodes.length
    );

    return {
      output: tpl,
      patches: tpl.patches,
      init: tpl.init,
      traversal: [
        {
          type: InstructionEnum.PushOutput,
          output: tpl.items,
        },
      ],
      scope: tpl.scope,
    };
  }

  private append(newObject: WebElement): Program | void {
    const { currentTarget } = this;

    if (currentTarget.output instanceof HTMLElement) {
      if (currentTarget.prop) {
        throw new Error(
          'Cannot append object to a property of an HTMLElement.'
        );
      }

      currentTarget.output.appendChild(newObject);
      return [
        {
          type: InstructionEnum.PushIndex,
          index: currentTarget.output.childNodes.length - 1,
        },
      ];
    } else if (currentTarget.output instanceof AutomatonConditional) {
      const { items } = currentTarget.output;
      const idx = items.length;
      items.push(newObject);
      if (currentTarget.output.visible) {
        currentTarget.output.output.appendChild(newObject);
      }

      return [
        {
          type: InstructionEnum.PushIndex,
          index: idx,
        },
      ];
    } else if (currentTarget.output instanceof AutomatonTemplate) {
      const offset = currentTarget.output.items.length;
      currentTarget.output.items.push(newObject);
      return [
        {
          type: InstructionEnum.PushIndex,
          index: offset,
        },
      ];
    } else {
      throw new Error('Cannot append object to the current target output.');
    }
  }
}

class AutomatonConditional {
  public items: any[] = [];
  public offset: number;

  constructor(
    public output: HTMLElement,
    public lense: Lense<boolean>,
    public visible: boolean | void
  ) {
    this.offset = this.output.childNodes.length;
  }

  fragment = () => {
    if (this.visible) return new Fragment(this.output, this.offset);
    else return this.items;
  };

  show(visible: boolean) {
    if (this.visible === visible) return;

    this.visible = visible;

    if (visible) {
      const referenceNode = this.output.childNodes[this.offset];
      if (referenceNode) {
        for (const item of this.items) {
          this.output.insertBefore(item, referenceNode);
        }
      } else {
        for (const item of this.items) {
          this.output.appendChild(item);
        }
      }
    } else {
      for (let i = this.offset + this.items.length - 1; i >= this.offset; i--) {
        const childNode = this.output.childNodes[i];
        childNode.remove();
      }
    }
  }
}

class Fragment {
  constructor(
    public output: HTMLElement,
    public offset: number
  ) {}
}
