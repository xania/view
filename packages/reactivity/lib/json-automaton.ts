import {
  Automaton,
  AutomatonConditional,
  AutomatonRegion,
  AutomatonTarget,
  AutomatonTemplate,
  IRegion,
  ITextNode,
  AutomatonObject as AutomatonObject,
} from './automaton';
import { Instruction, InstructionEnum, type Program } from './program';
import {
  Func,
  ItemState,
  Lense,
  resolveRootState,
  RootScope,
  Scope,
  State,
} from './state';

export const type = Symbol('type');
export const events = Symbol('events');
export const children = Symbol('children');
export type ObjectEvents = Record<string, Function>;

export class JsonAutomaton implements Automaton {
  public currentTarget: AutomatonTarget;
  constructor(
    private rootOutput: AutomatonTarget['output'],
    public scope: Scope = RootScope
  ) {
    this.currentTarget = {
      output: rootOutput,
      traversal: [],
      patches: (scope.patches ??= new Map()),
      scope,
    };
  }

  // Platform specific
  appendObject(_type?: string) {
    const { currentTarget } = this;

    const newObject: Record<string | number, any> & {
      [type]?: any;
      [events]?: ObjectEvents;
    } = {};

    if (_type) {
      newObject[type] = _type;
    }

    const newNode = new AutomatonObject(newObject);

    return {
      output: newNode,
      traversal:
        this.append(currentTarget.output, newObject, currentTarget.prop) ?? [],
      scope: currentTarget.scope,
    };
  }

  pushRegion(visible: boolean | void = true) {
    const { currentTarget } = this;
    if (!currentTarget) {
      throw Error('Cannot push standalone region, a target is not found');
    }

    if (!(currentTarget.output instanceof Array)) {
      throw Error('output is not an array');
    }

    const newRegion = new AutomatonRegion(currentTarget.output, visible);

    return {
      output: newRegion,
      traversal: [],
      scope: currentTarget.scope,
    };
  }

  pushConditional(lense: Lense<any>, stateValue: any): AutomatonTarget {
    const { currentTarget } = this;
    if (!(currentTarget.output instanceof Array)) {
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

  pushTemplate(): AutomatonTarget {
    const { currentTarget } = this;
    if (!(currentTarget.output instanceof Array)) {
      throw Error('output is not an array');
    }

    const childScope = currentTarget.scope.pushScope();

    const tpl = new AutomatonTemplate(childScope, currentTarget.output.length);

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

  private append(
    output: AutomatonTarget['output'],
    value: any,
    prop: string | undefined = undefined
  ): Instruction[] | void {
    if (output instanceof AutomatonObject) {
      if (!prop) {
        throw Error('Cannot set value, prop is not selected');
      }
      if (!(prop in output.object)) {
        output.object[prop] = value;
      }
      return [
        {
          type: InstructionEnum.PushProperty,
          prop: prop,
        },
      ];
    } else if (output instanceof AutomatonRegion) {
      const idx = output.push(value);
      return [
        {
          type: InstructionEnum.PushIndex,
          index: idx,
        },
      ];
    } else if (output instanceof AutomatonConditional) {
      const idx = output.push(value);
      return [
        {
          type: InstructionEnum.PushIndex,
          index: idx,
        },
      ];
    } else if (output instanceof AutomatonTemplate) {
      const offset = output.items.length;
      output.items.push(value);
      return [
        {
          type: InstructionEnum.PushIndex,
          index: offset,
        },
      ];
    } else if (output instanceof Array) {
      const offset = output.length;
      output.push(value);
      return [
        {
          type: InstructionEnum.PushIndex,
          index: offset,
        },
      ];
    } else
      throw Error(
        'invalid state: current expected to be array when property is not provided'
      );
  }

  appendArray() {
    const { currentTarget } = this;

    const copy: any[] = [];

    return {
      output: copy,
      traversal:
        this.append(currentTarget.output, copy, currentTarget.prop) ?? [],
      scope: currentTarget.scope,
    };
  }

  appendValue<T>(lense: Lense<any>, stateValue?: T): void {
    let { output } = this.currentTarget;

    const currentPatches = (this.currentTarget.patches ??= new Map<
      State,
      Instruction[]
    >());

    const rootKey = resolveRootState(lense);

    if (!currentPatches.has(rootKey)) {
      currentPatches.set(rootKey, []);
    }

    const stateEvent = currentPatches.get(rootKey)!;
    appendStateRead(lense, stateEvent);

    if (output instanceof AutomatonObject) {
      const { object } = output;
      const prop = this.currentTarget.prop;
      if (!prop) {
        throw Error('Cannot append value to object, need prop');
      }
      object[prop] = stateValue;

      stateEvent.push({
        type: InstructionEnum.UpdateObject,
        property: prop,
      });
    } else if (output instanceof Array) {
      const nodeIndex = output.length;
      output.push(stateValue);

      stateEvent.push({
        type: InstructionEnum.UpdateArray,
        index: nodeIndex,
      });
    } else if (output instanceof AutomatonTemplate) {
      const nodeIndex = output.items.length;
      output.items.push(stateValue);

      stateEvent.push({
        type: InstructionEnum.UpdateArray,
        index: nodeIndex,
      });
    } else if (output instanceof AutomatonRegion) {
      const idx = output.push(stateValue);

      stateEvent.push({
        type: InstructionEnum.UpdateArray,
        index: idx,
      });
    } else if (output instanceof AutomatonConditional) {
      const idx = output.push(stateValue);

      stateEvent.push({
        type: InstructionEnum.UpdateArray,
        index: idx,
      });
    } else {
      debugger;
    }
  }

  appendText(content: ITextNode['nodeValue']): void {
    const { output, prop } = this.currentTarget;

    if (output instanceof AutomatonObject) {
      if (!prop) {
        throw Error('Cannot append text, prop is not selected');
      }
      output.object[prop] = content;
    } else if (output instanceof AutomatonRegion) {
      output.push(content);
    } else if (output instanceof AutomatonConditional) {
      output.push(content);
    } else if (output instanceof AutomatonTemplate) {
      output.items.push(content);
    } else if (output instanceof Array) {
      output.push(content);
    } else if (prop) {
      const target = output as Record<string | number, any>;
      target[prop] = content;
    } else {
      throw Error('Not yet implemented!');
    }
  }
}

export function appendStateRead(lense: Lense<any>, program: Program) {
  const sub: Program = [];

  while (true) {
    if (lense instanceof State) {
      sub.push({
        type: InstructionEnum.Read,
        key: lense.key,
        initial: lense.initial,
      });
      break;
    } else if (lense instanceof ItemState) {
      sub.push({
        type: InstructionEnum.Read,
        key: lense.key,
        initial: undefined,
      });
      break;
    } else if (lense instanceof Func) {
      sub.push({
        type: InstructionEnum.MapState,
        func: lense.func,
        sourceKey: lense.parent.key,
        targetKey: lense.key,
      });
      lense = lense.parent;
    } else {
      throw Error('appendStateRead: Invalid lense type');
    }
  }

  for (let i = sub.length - 1; i >= 0; i--) {
    program.push(sub[i]);
  }

  return program;
}

function canReuseCurrentValue(program: Instruction[], key: symbol) {
  let length = program.length;

  while (length--) {
    const instr = program[length];

    if (
      instr.type === InstructionEnum.MapState ||
      instr.type === InstructionEnum.Effect
    ) {
      return false;
    }

    if (instr.type === InstructionEnum.Read && instr.key) {
      return instr.key === key;
    }
  }

  return false;
}

export function concatOptimized(
  target: Instruction[],
  program?: Instruction[]
) {
  if (!program) return target;

  for (const instruction of program) {
    if (
      instruction.type === InstructionEnum.Read &&
      canReuseCurrentValue(target, instruction.key)
    ) {
      continue;
    }
    target.push(instruction);
  }
  return target;
}
