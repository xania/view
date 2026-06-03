import {
  AutomatonRegion,
  AutomatonTarget,
  AutomatonTemplate,
  IRegion,
  ITextNode,
  ObjectProperty,
  TextNodeUpdater,
} from './automaton';
import {
  Instruction,
  InstructionEnum,
  type Program,
  TraversalInstruction,
} from './program';
import { FuncArrow, Scope, State } from './state';

export enum JsonEnum {
  Object = 99823786,
  String,
  Property,
}

export type JToken = JObject | JString | JArray;

export interface JObject {
  type: JsonEnum.Object;
  properties?: JProperty[];
}

export type JArray = JToken[];

interface JProperty {
  name: string;
  value: JToken;
}

interface JString {
  type: JsonEnum.String;
  value: string;
}

export class JsonAutomaton {
  private targets: AutomatonTarget[] = [];
  public currentTarget: AutomatonTarget;
  constructor(
    public rootOutput: AutomatonTarget['output'],
    public events: AutomatonTarget['events'] = {}
  ) {
    this.currentTarget = {
      output: rootOutput,
      traversal: [],
      events,
    };
  }

  appendObject() {
    const { currentTarget } = this;
    this.targets.push(currentTarget);

    const newObject = {};

    const newNode = new ObjectProperty(newObject);

    this.currentTarget = {
      output: newNode,
      traversal: this.setValue(currentTarget.output, newObject) ?? [],
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
    };

    return newRegion;
  }

  pushTemplate(scope: Scope) {
    const { currentTarget } = this;
    if (currentTarget) {
      this.targets.push(currentTarget);
    }
    if (!(currentTarget.output instanceof Array)) {
      throw Error('output is not an array');
    }

    const tpl = new AutomatonTemplate(currentTarget.output, scope);
    this.currentTarget = {
      output: tpl,
      traversal: [
        {
          type: InstructionEnum.PushIndex,
          index: currentTarget.output.length,
        },
      ],
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
      const parentEvents = (parentTarget.events ??= {});

      if (currentTarget.output instanceof AutomatonTemplate) {
        const regions = currentTarget.output.regions;
        for (const key of Reflect.ownKeys(events)) {
          const program = events[key];
          const result: Program = [
            {
              type: InstructionEnum.SelectFragments,
              indices: regions,
              key: Symbol(),
              jump: program.length + 2,
            },
          ];

          // result.push(...program);
          concatOptimized(result, program);

          result.push(
            { type: InstructionEnum.PopOutput },
            {
              type: InstructionEnum.Jump,
              steps: -result.length - 2,
            }
          );

          parentEvents[key] = result;
        }
      } else {
        for (const key of Reflect.ownKeys(events)) {
          const eventProgram = events[key];
          const program: Instruction[] = currentTarget.traversal.slice(0);

          concatOptimized(program, eventProgram);

          let depth = getDepth(currentTarget.traversal);
          while (depth--) {
            program.push({ type: InstructionEnum.PopOutput });
          }

          if (parentEvents[key]) {
            parentEvents[key].push(...program);
          } else {
            parentEvents[key] = program;
          }
        }
      }
    }

    this.currentTarget = parentTarget;
  }

  setValue(
    output: AutomatonTarget['output'],
    value: any
  ): TraversalInstruction[] | void {
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
    } else if (output instanceof Array) {
      const offset = output.length;
      output.push(value);
      return [
        {
          type: InstructionEnum.PushIndex,
          index: offset,
        },
      ];
    } else if (output instanceof AutomatonTemplate) {
      return [
        {
          type: InstructionEnum.PushIndex,
          index: output.push(value),
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
    };
  }

  appendValue<T>(state: State<any>, stateValue?: T): void {
    let { output } = this.currentTarget;

    const currentEvents = (this.currentTarget.events ??= {});

    const stateEvent = (currentEvents[state.graph] ??= []);
    appendStateRead(state, stateEvent);

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
    } else if (output instanceof AutomatonTemplate) {
      const itemIdx = output.push(stateValue);

      if (state.scope.level < output.scope.level) {
        stateEvent.push({
          type: InstructionEnum.UpdateArray,
          index: itemIdx,
        });
      } else {
        stateEvent.push({
          type: InstructionEnum.UpdateArray,
          index: itemIdx,
        });
      }
    } else if (output instanceof AutomatonRegion) {
      const idx = output.push(stateValue);

      stateEvent.push({
        type: InstructionEnum.UpdateArray,
        index: idx,
      });
    } else {
      debugger;
    }
  }

  appendText(
    content: ITextNode['nodeValue'],
    property?: string
  ): TextNodeUpdater {
    if (content instanceof Scope) {
      debugger;
    }
    const { output: data } = this.currentTarget;

    if (data instanceof ObjectProperty) {
      if (!data.prop) {
        throw Error('Cannot append text, prop is not selected');
      }
      data.object[data.prop] = content;
      return () => {
        debugger;
      };
    } else if (data instanceof AutomatonTemplate) {
      data.push(content);
      return () => {
        debugger;
      };
    } else if (data instanceof AutomatonRegion) {
      const idx = data.push(content);
      return (newValue) => {
        data.update(idx, newValue);
      };
    } else if (data instanceof Array) {
      const nodeIndex = data.length;
      data.push(content);

      return function (value: ITextNode['nodeValue']) {
        data[nodeIndex] = value;
      };
    } else if (property) {
      const target = data as Record<string | number, any>;
      target[property] = content;

      return function (value: ITextNode['nodeValue']) {
        target[property] = value;
      };
    } else {
      throw Error('Not yet implemented!');
    }
  }
}

function getDepth(traversal: TraversalInstruction[]) {
  let depth = 0;
  for (const instruction of traversal) {
    if (
      instruction.type === InstructionEnum.PushIndex ||
      instruction.type === InstructionEnum.PushProperty
    ) {
      depth++;
    }
  }

  return depth;
}

function appendStateRead(state: State<any, any>, program: Program) {
  const chain: State<any, any>[] = [];
  let root = state;

  while (root.parent) {
    chain.unshift(root);
    root = root.parent;
  }

  program.push({
    type: InstructionEnum.Read,
    key: root.key,
    initial: root.initial,
  });
  for (const derived of chain) {
    const { arrows } = derived;
    if (arrows) {
      for (let i = arrows.length - 1; i >= 0; i--) {
        const arr = arrows[i];
        if (arr instanceof FuncArrow) {
          program.push({
            type: InstructionEnum.MapState,
            func: arr.func,
          });
        }
      }
    }
  }
}
function requireStateRead(program: Instruction[]) {
  let length = program.length;

  while (length--) {
    const instr = program[length];

    if (instr.type === InstructionEnum.MapState) {
      return true;
    }

    if (instr.type === InstructionEnum.Read && instr.key) {
      return false;
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
      !requireStateRead(target)
    ) {
      continue;
    }
    target.push(instruction);
  }
  return target;
}
