import { JsonAutomaton } from './json';
import { InstructionEnum, type Program } from './program';
import { FuncArrow, State, Value } from './state';

export class Sandbox {
  public values: Record<symbol, any> = {};

  constructor(public automaton: JsonAutomaton) {}

  update<T>(state: State<T, any>, newValue: Value<T>) {
    const { graph } = state;
    const { values } = this;
    const oldValue = values[state.key];

    if (oldValue === newValue) {
      return;
    }

    if (!this.automaton.events) return;
    const program = this.automaton.events[graph];
    if (!program) return;

    return this.execute(newValue, this.automaton.rootOutput, program);
  }

  execute(
    currentValue: any,
    output: unknown,
    program: Program,
    state?: ExecuteState
  ) {
    let currentOutput = output as any;

    let memory: Record<symbol, any> | undefined = state?.memory;
    let checkpoints: Record<symbol, any> | undefined = state?.checkpoints;

    for (
      let instructionIdx = state?.instructionIdx || 0;
      instructionIdx < program.length;
      instructionIdx++
    ) {
      if (currentValue instanceof Promise) {
        return currentValue.then((resolved) => {
          this.execute(resolved, currentOutput, program, {
            instructionIdx,
            memory,
            checkpoints,
          });
        });
      }

      const instruction = program[instructionIdx];

      const { type } = instruction;
      switch (type) {
        case InstructionEnum.UpdateArray:
          const { index } = instruction;
          if (currentOutput instanceof Array) {
            currentOutput[index] = currentValue;
          } else if (currentOutput instanceof Fragment) {
            const idx = currentOutput.offset + instruction.index;
            currentOutput.output[idx] = currentValue;
          } else {
            throw Error('not an array');
          }
          break;
        case InstructionEnum.UpdateObject:
          const { property } = instruction;

          if (currentOutput instanceof Array) {
            throw Error('not an object');
          } else if (
            'update' in currentOutput &&
            currentOutput.update instanceof Function
          ) {
            currentOutput.update(property, currentValue);
          } else {
            currentOutput[property] = currentValue;
          }
          break;
        case InstructionEnum.Show:
          instruction.node.show(currentValue);
          break;
        case InstructionEnum.Jump:
          instructionIdx += instruction.steps;
          break;

        case InstructionEnum.SelectProperty:
          if (
            currentOutput instanceof Fragment ||
            currentOutput instanceof Array
          ) {
            throw Error('Invalid operation: Array or region not expected');
          }

          currentOutput = currentOutput[instruction.prop];
          break;
        case InstructionEnum.SelectIndex:
          if (currentOutput instanceof Array) {
            currentOutput = currentOutput[instruction.index];
          } else if (currentOutput instanceof Fragment) {
            const idx = currentOutput.offset + instruction.index;
            currentOutput = currentOutput.output[idx];
          } else {
            throw Error('Invalid operation: Array or region not expected');
          }

          break;

        case InstructionEnum.SelectFragments:
          let fragmentIdx: number = 0;
          if (!memory || memory[instruction.key] === undefined) {
            fragmentIdx = 0;
          } else {
            fragmentIdx = 1 + memory[instruction.key];
          }

          if (fragmentIdx >= instruction.indices.length) {
            instructionIdx += instruction.jump;
          } else {
            if (memory) {
              memory[instruction.key] = fragmentIdx;
            } else {
              memory = { [instruction.key]: fragmentIdx };
            }

            const checkpoint: Fragment | undefined =
              checkpoints && checkpoints[instruction.key];

            if (checkpoint) {
              checkpoint.offset = instruction.indices[fragmentIdx];
              currentOutput = checkpoint;
            } else if (currentOutput instanceof Array) {
              currentOutput = new Fragment(
                currentOutput,
                instruction.indices[fragmentIdx]
              );
            } else if (currentOutput instanceof Fragment) {
              currentOutput = new Fragment(
                currentOutput.output,
                instruction.indices[fragmentIdx]
              );
            } else {
              throw Error('not an array');
            }

            if (checkpoints) {
              checkpoints[instruction.key] = currentOutput;
            } else {
              checkpoints = { [instruction.key]: currentOutput };
            }
          }

          break;
        default:
          const unsupportedType = InstructionEnum[type];
          console.warn(`instruction type not supported ${unsupportedType}`);
          break;
      }
    }
  }
}

interface ExecuteState {
  instructionIdx?: number;
  memory?: Record<symbol, any>;
  checkpoints?: Record<symbol, any>;
}

export function compile(state: State<any, any>, program: Program) {
  let s: State<any, any> | undefined = state;

  while (s) {
    let index = 0;
    while (index < program.length) {
      const curr = program[index];
      const { type } = curr;
      if (type === InstructionEnum.Read) {
        if (curr.key == s.key) {
          return;
        }
      }
      index++;
    }

    const partial: Program = [];

    const { parent, arrows } = s;
    if (parent) {
      partial.push({
        type: InstructionEnum.Read,
        key: parent.key,
      });
    }

    if (arrows) {
      for (let i = arrows.length - 1; i >= 0; i--) {
        const arr = arrows[i];
        if (arr instanceof FuncArrow) {
          partial.push({
            type: InstructionEnum.Map,
            func: arr.func,
          });
        }
      }
    }

    if (parent) {
      partial.push({
        type: InstructionEnum.Write,
        key: s.key,
      });
    }

    if (partial.length) {
      program.splice(index, 0, ...partial);
    }

    s = s.parent;
  }
}

function printProgram(program: Program) {
  return program
    .map((instruction) => InstructionEnum[instruction.type])
    .join('\n');
}

export class Fragment {
  constructor(
    public output: any[],
    public offset: number
  ) {}
}
