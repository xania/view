import { Automaton, AutomatonConditional, ITextNode } from './automaton';
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
import {
  AutomatonArrayTarget,
  AutomatonObject,
  AutomatonObjectTarget,
  AutomatonTarget,
  AutomatonTargetEnum,
  AutomatonTemplate,
} from './target';

export const type = Symbol('type');
export const events = Symbol('events');
export const children = Symbol('children');
export type ObjectEvents = Record<string, Function>;

export class JsonAutomaton implements Automaton {
  public currentTarget: AutomatonTarget;
  constructor(
    private rootOutput: AutomatonObject | any[],
    public scope: Scope = RootScope
  ) {
    if (rootOutput instanceof Array)
      this.currentTarget = {
        output: rootOutput,
        traversal: [],
        patches: new Map(),
        scope,
        type: AutomatonTargetEnum.Array,
      };
    else {
      this.currentTarget = {
        output: rootOutput,
        traversal: [],
        patches: new Map(),
        scope,
        type: AutomatonTargetEnum.Object,
      };
    }
  }

  // Platform specific
  appendObject(
    _type?: string,
    eventsObject?: Record<string, Function>
  ): AutomatonObjectTarget {
    const { currentTarget } = this;

    const newObject: Record<string | number, any> & {
      [type]?: any;
      [events]?: ObjectEvents;
    } = {};

    if (_type) {
      newObject[type] = _type;
    }

    if (eventsObject) {
      const eventNames = Object.keys(eventsObject);
      if (eventNames.length > 0) {
        newObject[events] ??= {};

        for (const eventName of eventNames) {
          const handler = eventsObject[eventName];
          newObject[events][eventName] = handler;
        }
      }
    }

    return {
      output: newObject,
      traversal: this.append(currentTarget, newObject) ?? [],
      scope: currentTarget.scope,
      type: AutomatonTargetEnum.Object,
    };
  }

  selectProperty(prop: string) {
    const { currentTarget } = this;

    if (currentTarget.type === AutomatonTargetEnum.Object) {
      currentTarget.prop = prop;
    }
  }

  // pushConditional(
  //   lense: Lense<any>,
  //   stateValue: any
  // ): AutomatonConditionalTarget {
  //   const { currentTarget } = this;

  //   if (currentTarget.type !== AutomatonTargetEnum.Array) {
  //     throw Error('current target is not an array');
  //   }

  //   const output = currentTarget.output;

  //   const conditional = new AutomatonConditional(output, stateValue);
  //   const state = resolveRootState(lense);

  //   return {
  //     type: AutomatonTargetEnum.Conditional,
  //     output: conditional,
  //     traversal: [
  //       {
  //         type: InstructionEnum.PushOutput,
  //         output: [],
  //       },
  //     ],
  //     scope: currentTarget.scope,
  //     patches: new Map<State, Program>([
  //       [
  //         state,
  //         (() => {
  //           const program = appendStateRead(lense, []);
  //           program.push({
  //             type: InstructionEnum.Show,
  //             node: {
  //               show: (_visible: boolean) => {
  //                 throw Error('not yet implemented');
  //               },
  //             },
  //           } as Instruction);
  //           return program;
  //         })(),
  //       ],
  //     ]),
  //   };
  // }

  pushChildren(): AutomatonTarget {
    const { currentTarget } = this;

    if (currentTarget.type !== AutomatonTargetEnum.Object) {
      throw Error('current target is not an array');
    }

    const output = currentTarget.output;
    const childrenList = (output[children] ??= []);
    return {
      output: childrenList,
      traversal: [
        {
          type: InstructionEnum.PushChildren,
        },
      ],
      scope: this.currentTarget.scope,
      type: AutomatonTargetEnum.Array,
    };
  }

  // pushTemplate(): AutomatonTemplateTarget {
  //   const { currentTarget } = this;

  //   const childScope = currentTarget.scope.pushScope();

  //   if (currentTarget.type === AutomatonTargetEnum.Array) {
  //     const { output: array, offset } = currentTarget;
  //     if (offset != array.length) {
  //       throw Error(
  //         'invalid state: current expected to be at the end of array when pushing template'
  //       );
  //     }

  //     const tpl = new AutomatonTemplate(childScope, array.length);

  //     return {
  //       type: AutomatonTargetEnum.Template,
  //       output: tpl,
  //       patches: tpl.patches,
  //       init: tpl.init,
  //       traversal: [
  //         {
  //           type: InstructionEnum.PushOutput,
  //           output: tpl.items,
  //         },
  //       ],
  //       scope: tpl.scope,
  //     };
  //   } else {
  //     throw Error(
  //       'invalid state: current expected to be array when property is not provided'
  //     );
  //   }
  // }

  private append(target: AutomatonTarget, value: any): Instruction[] | void {
    if (target.type === AutomatonTargetEnum.Conditional) {
      const idx = target.output.push(value);
      return [
        {
          type: InstructionEnum.UpdateArray,
          index: idx,
        },
      ];
    } else if (target.type === AutomatonTargetEnum.Array) {
      const offset = target.output.length;
      // if (offset !== target.offset) {
      //   throw Error(
      //     'invalid state: current expected to be at the end of array when appending value'
      //   );
      // }

      target.output.push(value);
      return [
        {
          type: InstructionEnum.PushIndex,
          index: offset,
        },
      ];
    } else if (target.type === AutomatonTargetEnum.Object) {
      const { output, prop } = target;
      if (!prop) {
        throw Error(
          'invalid state: current object target does not specify a property to append value to'
        );
      }

      output[prop] = value;
      return [
        {
          type: InstructionEnum.PushProperty,
          prop: prop,
        },
      ];
    } else {
      throw Error(
        'invalid state: current expected to be array or object when appending value'
      );
    }

    // }
    //   throw Error(
    //     'invalid state: current expected to be array when property is not provided'
    //   );
  }

  appendArray(): AutomatonArrayTarget {
    const { currentTarget } = this;

    const copy: any[] = [];

    return {
      type: AutomatonTargetEnum.Array,
      output: copy,
      traversal: this.append(currentTarget, copy) ?? [],
      scope: currentTarget.scope,
    };
  }

  appendValue<T>(stateValue?: T): Program | void {
    const { currentTarget } = this;

    if (currentTarget.type === AutomatonTargetEnum.Array) {
      const { output: array } = currentTarget;
      const nodeIndex = array.length;
      array.push(stateValue);

      return [
        {
          type: InstructionEnum.UpdateArray,
          index: nodeIndex,
        },
      ];
    } else if (currentTarget.type === AutomatonTargetEnum.Conditional) {
      const { output } = currentTarget;
      const nodeIndex = output.push(stateValue);

      return [
        {
          type: InstructionEnum.Effect,
          func: (value) => output.update(value, nodeIndex),
        },
      ];
    } else if (currentTarget.type === AutomatonTargetEnum.Object) {
      const { prop, output } = currentTarget;
      if (prop) {
        output[prop] = stateValue;
        return [
          {
            type: InstructionEnum.UpdateObject,
            property: prop,
          },
        ];
      } else {
        throw Error(
          'invalid state: current object target does not specify a property to append value to'
        );
      }
    } else {
      throw Error('unexpected target');
    }
  }

  appendText(content: ITextNode['nodeValue']): void {
    const { currentTarget } = this;

    if (currentTarget.type === AutomatonTargetEnum.Array) {
      currentTarget.output.push(content);
    } else if (currentTarget.type === AutomatonTargetEnum.Object) {
      const { output, prop } = currentTarget;
      if (prop) {
        output[prop] = content;
      } else {
        throw Error('Object property is not set');
      }
    } else if (currentTarget.type === AutomatonTargetEnum.Conditional) {
      currentTarget.output.push(content);
    } else {
      debugger;
      throw Error('invalid target type');
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
