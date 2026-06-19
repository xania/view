import { cloneTemplateItem } from './automaton';
import { reconcile, ReconcileOperation } from './core/reconcile';
import { JsonAutomaton } from './json';
import { InstructionEnum, type Program } from './program';
import { FuncArrow, State, Value } from './state';

export class Sandbox {
  public values: Record<symbol, any> = {};

  constructor(public automaton: JsonAutomaton) {}

  update<T>(state: State<T>, newValue: Value<T>) {
    const { values } = this;
    const oldValue = values[state.key];

    if (oldValue === newValue) {
      return;
    }

    const events = this.automaton.currentTarget.events;

    if (!events) return;
    const program = events.get(state);
    if (!program) return;

    values[state.key] = newValue;

    const execState: ExecuteState = {
      currentOutput: this.automaton.currentTarget.output,
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

    if (currentValue instanceof Promise) {
      return currentValue.then((resolved) => {
        return this.execute(resolved, program, state);
      });
    }

    for (
      let instructionIdx = state?.instructionIdx ?? 0;
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
        case InstructionEnum.Clone:
          instruction.template.clone();
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

          if (!state.currentOutput) {
            debugger;
          }

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
        case InstructionEnum.IfVisible:
          if (!instruction.node.visible) {
            instructionIdx += instruction.steps;
          }
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

        case InstructionEnum.PushOutput:
          pushToStack(state, instruction.output);
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

        case InstructionEnum.PushFragment:
          if (state.currentOutput instanceof Array) {
            pushToStack(
              state,
              new Fragment(state.currentOutput, instruction.offset)
            );
          } else if (state.currentOutput instanceof Fragment) {
            pushToStack(
              state,
              new Fragment(
                state.currentOutput.output,
                state.currentOutput.offset + instruction.offset
              )
            );
          } else {
            throw Error('Invalid operation: Array or fragment expected');
          }
          break;

        case InstructionEnum.Enumerate:
          {
            const { regions, items, offset } = instruction.tpl;

            let fragmentIdx: number = 0;
            if (!memory || memory[instruction.key] === undefined) {
              fragmentIdx = 0;
            } else {
              fragmentIdx = 1 + memory[instruction.key];
            }

            if (fragmentIdx >= regions.length) {
              instructionIdx += instruction.break;
            } else {
              if (memory) {
                memory[instruction.key] = fragmentIdx;
              } else {
                memory = { [instruction.key]: fragmentIdx };
              }

              const fragmentOffset = items.length * fragmentIdx;

              if (state.currentOutput instanceof Array) {
                pushToStack(
                  state,
                  new Fragment(state.currentOutput, fragmentOffset)
                );
              } else if (state.currentOutput instanceof Fragment) {
                pushToStack(
                  state,
                  new Fragment(
                    state.currentOutput.output,
                    state.currentOutput.offset + fragmentOffset
                  )
                );
              } else {
                throw Error('not an array');
              }
            }
          }
          break;

        case InstructionEnum.Reconcile:
          const { tpl, key } = instruction;

          if (!memory) {
            state.memory = memory = {};
          }

          let operations: Generator<ReconcileOperation, void> = memory[key];

          if (!operations) {
            operations = reconcile(currentValue, tpl);
            memory[key] = operations;
          }

          while (true) {
            var next = operations.next();

            if (next.done) {
              instructionIdx += instruction.break;
              break;
            }

            if (next.value.type === 'insert') {
              const { value, index } = next.value;
              currentValue = value;

              const clone = tpl.items.map(cloneTemplateItem);
              tpl.regions.splice(index, 0, { key: value });
              if (state.currentOutput instanceof Array) {
                state.currentOutput.splice(index, 0, ...clone);
                pushToStack(state, new Fragment(state.currentOutput, index));
              } else if (state.currentOutput instanceof Fragment) {
                state.currentOutput.output.splice(
                  state.currentOutput.offset + index,
                  0,
                  ...clone
                );
                pushToStack(
                  state,
                  new Fragment(
                    state.currentOutput.output,
                    state.currentOutput.offset + index
                  )
                );
              } else {
                throw Error('Failed to clone: not supported output');
              }

              break;
            }
          }

          break;

        case InstructionEnum.SelectTemplate:
          const { regions, offset, items } = instruction.tpl;
          let fragmentIdx: number = 0;
          if (!memory || memory[instruction.key] === undefined) {
            fragmentIdx = 0;
          } else {
            fragmentIdx = 1 + memory[instruction.key];
          }

          if (fragmentIdx >= regions.length) {
            instructionIdx += instruction.jump;
          } else {
            if (memory) {
              memory[instruction.key] = fragmentIdx;
            } else {
              memory = { [instruction.key]: fragmentIdx };
            }

            const fragmentOffset = offset + items.length * fragmentIdx;

            if (state.currentOutput instanceof Array) {
              pushToStack(
                state,
                new Fragment(state.currentOutput, fragmentOffset)
              );
            } else if (state.currentOutput instanceof Fragment) {
              pushToStack(
                state,
                new Fragment(
                  state.currentOutput.output,
                  state.currentOutput.offset + fragmentOffset
                )
              );
            } else {
              throw Error('not an array');
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
  outputStack?: any[];
}

function pushToStack(state: ExecuteState, output: any) {
  if (state.outputStack === undefined) {
    state.outputStack = [state.currentOutput];
  } else {
    state.outputStack.push(state.currentOutput);
  }

  if (output instanceof Function) state.currentOutput = output();
  else state.currentOutput = output;
}

function popFromStack(state: ExecuteState) {
  if (state.outputStack === undefined || state.outputStack.length === 0) {
    throw Error('Output stack underflow');
  }
  state.currentOutput = state.outputStack.pop();
}

// export function compile(state: State<any>, program: Program) {
//   let s: State<any> | undefined = state;

//   while (s) {
//     let index = 0;
//     while (index < program.length) {
//       const curr = program[index];
//       const { type } = curr;
//       if (type === InstructionEnum.Read) {
//         if (curr.key == s.key) {
//           return;
//         }
//       }
//       index++;
//     }

//     const partial: Program = [];

//     const { parent, arrows } = s;
//     if (parent) {
//       partial.push({
//         type: InstructionEnum.Read,
//         key: parent.key,
//         initial: parent.initial,
//       });
//     }

//     if (arrows) {
//       for (let i = arrows.length - 1; i >= 0; i--) {
//         const arr = arrows[i];
//         if (arr instanceof FuncArrow) {
//           partial.push({
//             type: InstructionEnum.MapState,
//             func: arr.func,
//             key: state.key,
//           });
//         }
//       }
//     }

//     if (parent) {
//       partial.push({
//         type: InstructionEnum.Write,
//         key: s.key,
//       });
//     }

//     if (partial.length) {
//       program.splice(index, 0, ...partial);
//     }

//     s = s.parent;
//   }
// }

export class Fragment {
  constructor(
    public output: any[],
    public offset: number
  ) {}
}
