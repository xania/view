import {
  Automaton,
  AutomatonConditional,
  AutomatonRegion,
  AutomatonTarget,
  AutomatonTemplate,
  IRegion,
  ITextNode,
  ObjectProperty,
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

export class JsonAutomaton implements Automaton {
  private targets: AutomatonTarget[] = [];
  public currentTarget: AutomatonTarget;
  constructor(
    rootOutput: AutomatonTarget['output'],
    public scope: Scope = RootScope
  ) {
    this.currentTarget = {
      output: rootOutput,
      traversal: [],
      events: (scope.events ??= new Map()),
      scope,
    };
  }

  appendObject(_type?: string) {
    const { currentTarget } = this;
    this.targets.push(currentTarget);

    const newObject: Record<symbol | string | number, any> = {};

    if (_type) {
      newObject[type] = _type;
    }

    const newNode = new ObjectProperty(newObject);

    this.currentTarget = {
      output: newNode,
      traversal: this.setValue(currentTarget.output, newObject) ?? [],
      scope: currentTarget.scope,
    };
  }

  selectProperty(prop: string): void {
    const { currentTarget } = this;

    if (currentTarget.output instanceof ObjectProperty) {
      currentTarget.output.prop = prop;
    }
  }

  pushRegion(visible: boolean | void = true): IRegion {
    const { currentTarget } = this;
    if (!currentTarget) {
      throw Error('Cannot push standalone region, a target is not found');
    }

    if (!(currentTarget.output instanceof Array)) {
      throw Error('output is not an array');
    }
    this.targets.push(currentTarget);

    const newRegion = new AutomatonRegion(currentTarget.output, visible);

    this.currentTarget = {
      output: newRegion,
      traversal: [],
      scope: currentTarget.scope,
    };

    return newRegion;
  }

  pushConditional(lense: Lense<any>, stateValue: any): AutomatonConditional {
    const { currentTarget } = this;
    if (!currentTarget) {
      throw Error('Cannot push standalone region, a target is not found');
    }

    if (!(currentTarget.output instanceof Array)) {
      throw Error('output is not an array');
    }
    this.targets.push(currentTarget);

    const newConditional = new AutomatonConditional(
      currentTarget.output,
      lense,
      stateValue
    );

    const state = resolveRootState(lense);

    this.currentTarget = {
      output: newConditional,
      traversal: [
        {
          type: InstructionEnum.PushOutput,
          output: newConditional.fragment,
        },
      ],
      scope: currentTarget.scope,
      events: new Map<State, Program>([
        [
          state,
          (() => {
            const program = appendStateRead(lense, []);
            program.push({
              type: InstructionEnum.Show,
              node: newConditional,
            } as Instruction);
            return program;
          })(),
        ],
      ]),
    };

    return newConditional;
  }

  registerReconciler<T>(
    list: Lense<T[]>,
    tpl: AutomatonTemplate,
    item?: ItemState<T>
  ) {
    const { currentTarget } = this;
    if (!(currentTarget.output instanceof Array)) {
      throw Error('output is not an array');
    }

    const offset = tpl.offset;
    tpl.itemKey ??= item?.key;

    currentTarget.events ??= new Map();

    const listRoot = resolveRootState(list);

    if (!item || !tpl.events.has(item)) {
      const program = appendStateRead(list, []);
      program.push(
        {
          type: InstructionEnum.PushFragment,
          offset,
        },
        {
          type: InstructionEnum.Reconcile,
          tpl,
          key: Symbol(),
          break: 2,
        }
      );

      program.push(
        { type: InstructionEnum.PopOutput },
        {
          type: InstructionEnum.Jump,
          steps: -3,
        }
      );

      appendOrSetProgram(currentTarget, listRoot, program);
    }

    for (const [state, stateProgram] of tpl.events) {
      if (state === item) {
        const itemProgram = stateProgram;

        const program = appendStateRead(list, []);
        program.push(
          {
            type: InstructionEnum.PushFragment,
            offset,
          },
          {
            type: InstructionEnum.Reconcile,
            tpl,
            key: Symbol(),
            break: 2 + itemProgram.length,
          }
        );

        program.push(
          ...itemProgram,
          { type: InstructionEnum.PopOutput },
          {
            type: InstructionEnum.Jump,
            steps: -itemProgram.length - 3,
          }
        );

        appendOrSetProgram(currentTarget, listRoot, program);
      } else {
        currentTarget.events ??= new Map();

        let parentProgram = currentTarget.events.get(state);

        if (!parentProgram) {
          parentProgram = [];
          currentTarget.events.set(state, parentProgram);
        }

        const itemProgram = concatOptimized([], stateProgram);

        parentProgram.push({
          type: InstructionEnum.Enumerate,
          tpl,
          key: Symbol(),
          break: itemProgram.length + 2,
        });

        parentProgram.push(
          ...itemProgram,
          { type: InstructionEnum.PopOutput },
          {
            type: InstructionEnum.Jump,
            steps: -itemProgram.length - 3,
          }
        );
      }
    }
  }

  pushTemplate() {
    const { currentTarget } = this;
    if (currentTarget) {
      this.targets.push(currentTarget);
    }
    if (!(currentTarget.output instanceof Array)) {
      throw Error('output is not an array');
    }

    const childScope = currentTarget.scope.pushScope();

    const tpl = new AutomatonTemplate(childScope, currentTarget.output.length);

    this.currentTarget = {
      output: tpl.items,
      events: tpl.events,
      traversal: [
        {
          type: InstructionEnum.PushOutput,
          output: tpl.items,
        },
      ],
      scope: tpl.scope,
    };

    return tpl;
  }

  popTarget(): void {
    if (this.targets.length == 0) {
      throw Error('cannot pop out root');
    }

    const { currentTarget } = this;
    const { events } = currentTarget;

    const parentTarget = this.targets.pop()!;

    if (events) {
      for (const [state, updates] of events) {
        if (state.scope.level > currentTarget.scope.level) {
          const scopeEvents = (state.scope.events ??= new Map<
            State,
            Instruction[]
          >());

          if (scopeEvents.has(state)) {
            scopeEvents.get(state)!.push(...updates);
          } else {
            scopeEvents.set(state, updates.slice());
          }
        } else {
          const eventProgram = updates;
          const program: Instruction[] = currentTarget.traversal.slice(0);

          concatOptimized(program, eventProgram);

          let depth = getDepth(currentTarget.traversal);
          while (depth--) {
            program.push({ type: InstructionEnum.PopOutput });
          }

          const parentEvents = (parentTarget.events ??= new Map<
            State,
            Instruction[]
          >());

          if (parentEvents.has(state)) {
            parentEvents.get(state)!.push(...program);
          } else {
            parentEvents.set(state, program.slice());
          }
        }
      }
      // }
    }

    this.currentTarget = parentTarget;
  }

  setValue(
    output: AutomatonTarget['output'],
    value: any
  ): Instruction[] | void {
    if (output instanceof ObjectProperty) {
      if (!output.prop) {
        throw Error('Cannot set value, prop is not selected');
      }
      output.object[output.prop] = value;
      return [
        {
          type: InstructionEnum.PushProperty,
          prop: output.prop,
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

    if (currentTarget) {
      this.targets.push(currentTarget);
    }

    const copy: any[] = [];

    this.currentTarget = {
      output: copy,
      traversal: this.setValue(currentTarget.output, copy) ?? [],
      scope: currentTarget.scope,
    };
  }

  appendValue<T>(lense: Lense<any>, stateValue?: T): void {
    let { output } = this.currentTarget;

    const currentEvents = (this.currentTarget.events ??= new Map<
      State,
      Instruction[]
    >());

    const rootKey = resolveRootState(lense);

    if (!currentEvents.has(rootKey)) {
      currentEvents.set(rootKey, []);
    }

    const stateEvent = currentEvents.get(rootKey)!;
    appendStateRead(lense, stateEvent);

    if (output instanceof ObjectProperty) {
      const { object, prop } = output;
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

  appendText(content: ITextNode['nodeValue'], property?: string): void {
    const { output } = this.currentTarget;

    if (output instanceof ObjectProperty) {
      if (!output.prop) {
        throw Error('Cannot append text, prop is not selected');
      }
      output.object[output.prop] = content;
    } else if (output instanceof AutomatonRegion) {
      const idx = output.push(content);
    } else if (output instanceof AutomatonConditional) {
      const idx = output.push(content);
    } else if (output instanceof Array) {
      const nodeIndex = output.length;
      output.push(content);
    } else if (property) {
      const target = output as Record<string | number, any>;
      target[property] = content;
    } else {
      throw Error('Not yet implemented!');
    }
  }
}

function getDepth(traversal: Instruction[]) {
  let depth = 0;
  for (const instruction of traversal) {
    if (
      instruction.type === InstructionEnum.PushIndex ||
      instruction.type === InstructionEnum.PushProperty ||
      instruction.type === InstructionEnum.PushOutput ||
      instruction.type === InstructionEnum.PushFragment
    ) {
      depth++;
    }
    if (instruction.type === InstructionEnum.PopOutput) {
      depth--;
    }
  }

  return depth;
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

function appendOrSetProgram(
  target: AutomatonTarget,
  state: State,
  program: Instruction[]
) {
  target.events ??= new Map();
  const existingProgram = target.events.get(state);
  if (existingProgram) {
    existingProgram.push(...program);
  } else {
    target.events.set(state, program);
  }
}
