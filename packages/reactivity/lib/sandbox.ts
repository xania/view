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

    values[state.key] = newValue;

    const execState: ExecuteState = {
      currentOutput: this.automaton.rootOutput,
      outputStack: [],
    };

    if (newValue instanceof Promise) {
      return newValue.then((resolved) => {
        values[state.key] = resolved;
        return this.execute(resolved, program, execState);
      });
    }

    return this.execute(newValue, program, execState);
  }

  execute(
    currentValue: any,
    program: Program,
    state: ExecuteState
  ): void | Promise<void> {
    let memory: Record<symbol, any> | undefined = state?.memory;
    let checkpoints: Record<symbol, any> | undefined = state?.checkpoints;

    if (currentValue instanceof Promise) {
      return currentValue.then((resolved) => {
        return this.execute(resolved, program, state);
      });
    }

    for (
      let instructionIdx = state?.instructionIdx || 0;
      instructionIdx < program.length;
      instructionIdx++
    ) {
      const instruction = program[instructionIdx];

      const { type } = instruction;
      switch (type) {
        case InstructionEnum.Read:
          currentValue = this.values[instruction.key] ?? instruction.initial;
          break;
        case InstructionEnum.Write:
          this.values[instruction.key] = currentValue;
          break;
        case InstructionEnum.MapState:
          currentValue = instruction.func(currentValue);
          break;
        case InstructionEnum.Effect:
          currentValue = instruction.func(currentValue);
          break;
        case InstructionEnum.SetText:
          instruction.node.nodeValue = currentValue;
          break;
        case InstructionEnum.UpdateArray:
          const { index } = instruction;
          if (state.currentOutput instanceof Array) {
            state.currentOutput[index] = currentValue;
          } else if (state.currentOutput instanceof Fragment) {
            const idx = state.currentOutput.offset + instruction.index;
            state.currentOutput.output[idx] = currentValue;
          } else {
            throw Error('not an array');
          }
          break;
        case InstructionEnum.UpdateObject:
          const { property } = instruction;

          if (state.currentOutput instanceof Array) {
            throw Error('not an object');
          } else if (
            'update' in state.currentOutput &&
            state.currentOutput.update instanceof Function
          ) {
            state.currentOutput.update(property, currentValue);
          } else {
            state.currentOutput[property] = currentValue;
          }
          break;
        case InstructionEnum.Show:
          instruction.node.show(currentValue);
          break;
        case InstructionEnum.Jump:
          instructionIdx += instruction.steps;
          break;

        case InstructionEnum.PopOutput:
          popFromStack(state);
          break;

        case InstructionEnum.PushProperty:
          if (
            state.currentOutput instanceof Fragment ||
            state.currentOutput instanceof Array
          ) {
            throw Error('Invalid operation: Array or region not expected');
          }

          pushToStack(state, state.currentOutput[instruction.prop]);
          break;
        case InstructionEnum.PushIndex:
          if (state.currentOutput instanceof Array) {
            pushToStack(state, state.currentOutput[instruction.index]);
          } else if (state.currentOutput instanceof Fragment) {
            const idx = state.currentOutput.offset + instruction.index;
            pushToStack(state, state.currentOutput.output[idx]);
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
              pushToStack(state, checkpoint);
            } else if (state.currentOutput instanceof Array) {
              pushToStack(
                state,
                new Fragment(
                  state.currentOutput,
                  instruction.indices[fragmentIdx]
                )
              );
            } else if (state.currentOutput instanceof Fragment) {
              pushToStack(
                state,
                new Fragment(
                  state.currentOutput.output,
                  state.currentOutput.offset + instruction.indices[fragmentIdx]
                )
              );
            } else {
              throw Error('not an array');
            }

            if (checkpoints) {
              checkpoints[instruction.key] = state.currentOutput;
            } else {
              checkpoints = { [instruction.key]: state.currentOutput };
            }
          }

          break;
        default:
          const unsupportedType = InstructionEnum[type];
          console.warn(`instruction type not supported ${unsupportedType}`);
          break;
      }

      if (currentValue instanceof Promise) {
        return currentValue.then((resolved) => {
          state.instructionIdx = instructionIdx + 1;
          return this.execute(resolved, program, state);
        });
      }
    }
  }
}

export interface ExecuteState {
  currentOutput: any;
  instructionIdx?: number;
  memory?: Record<symbol, any>;
  checkpoints?: Record<symbol, any>;
  outputStack?: any[];
}

function pushToStack(state: ExecuteState, output: any) {
  if (state.outputStack === undefined) {
    state.outputStack = [state.currentOutput];
  } else {
    state.outputStack.push(state.currentOutput);
  }
  state.currentOutput = output;
}

function popFromStack(state: ExecuteState) {
  if (state.outputStack === undefined || state.outputStack.length === 0) {
    throw Error('Output stack underflow');
  }
  state.currentOutput = state.outputStack.pop();
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
        initial: parent.initial,
      });
    }

    if (arrows) {
      for (let i = arrows.length - 1; i >= 0; i--) {
        const arr = arrows[i];
        if (arr instanceof FuncArrow) {
          partial.push({
            type: InstructionEnum.MapState,
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
