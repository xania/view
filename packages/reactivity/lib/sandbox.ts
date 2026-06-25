import { AutomatonTemplate, cloneTemplateItem } from './automaton';
import { reconcile, ReconcileOperation } from './core/reconcile';
import { JsonAutomaton } from './json';
import { InstructionEnum, type Program } from './program';
import { State, Value } from './state';

export class Sandbox {
  public rootValues: Record<symbol, any> = {};

  constructor(public automaton: JsonAutomaton) {}

  update<T>(state: State<T>, newValue: Value<T>) {
    const { rootValues } = this;
    const oldValue = rootValues[state.key];

    if (oldValue === newValue) {
      return;
    }

    const events = this.automaton.currentTarget.events;

    if (!events) return;
    const program = events.get(state);
    if (!program) return;

    const execState: ExecuteState = {
      currentOutput: this.automaton.currentTarget.output,
      outputStack: [],
      values: rootValues,
      valuesStack: [],
    };

    if (newValue instanceof Promise) {
      return newValue.then((resolved) => {
        rootValues[state.key] = resolved;
        return this.execute(program, execState);
      });
    } else {
      rootValues[state.key] = newValue;
      return this.execute(program, execState);
    }
  }

  execute(
    program: Program,
    exec: ExecuteState,
    currentValue?: any
  ): void | Promise<void> {
    let memory: Record<symbol, any> | undefined = exec?.memory;

    if (currentValue instanceof Promise) {
      return currentValue.then((resolved) => {
        return this.execute(program, exec, resolved);
      });
    }

    for (
      let instructionIdx = exec?.instructionIdx ?? 0;
      instructionIdx < program.length;
      instructionIdx++
    ) {
      const instruction = program[instructionIdx];

      const { type } = instruction;
      switch (type) {
        case InstructionEnum.Read:
          currentValue = execValue(exec, instruction.key);
          if (currentValue === undefined) {
            currentValue = instruction.initial;
          }
          break;
        case InstructionEnum.MapState:
          const sourceValue = execValue(exec, instruction.sourceKey);
          currentValue = instruction.func(sourceValue);
          exec.values[instruction.targetKey] = currentValue;
          break;
        case InstructionEnum.SetText:
          instruction.node.nodeValue = currentValue;
          break;
        case InstructionEnum.Clone:
          instruction.template.clone();
          break;
        case InstructionEnum.UpdateArray:
          const { index } = instruction;
          if (exec.currentOutput instanceof Array) {
            exec.currentOutput[index] = currentValue;
          } else if (exec.currentOutput instanceof Fragment) {
            const idx = exec.currentOutput.offset + instruction.index;
            exec.currentOutput.output[idx] = currentValue;
          } else {
            throw Error('not an array');
          }
          break;
        case InstructionEnum.UpdateObject:
          const { property } = instruction;

          if (exec.currentOutput instanceof Array) {
            throw Error('not an object');
          } else if (
            'update' in exec.currentOutput &&
            exec.currentOutput.update instanceof Function
          ) {
            exec.currentOutput.update(property, currentValue);
          } else {
            exec.currentOutput[property] = currentValue;
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
          popFromStack(exec);
          break;

        case InstructionEnum.PushProperty:
          if (
            exec.currentOutput instanceof Fragment ||
            exec.currentOutput instanceof Array
          ) {
            throw Error('Invalid operation: Array or region not expected');
          }

          pushToStack(exec, exec.currentOutput[instruction.prop]);
          break;

        case InstructionEnum.PushOutput:
          pushToStack(exec, instruction.output);
          break;

        case InstructionEnum.PushIndex:
          if (exec.currentOutput instanceof Array) {
            pushToStack(exec, exec.currentOutput[instruction.index]);
          } else if (exec.currentOutput instanceof Fragment) {
            const idx = exec.currentOutput.offset + instruction.index;
            pushToStack(exec, exec.currentOutput.output[idx]);
          } else {
            throw Error('Invalid operation: Array or region not expected');
          }
          break;

        case InstructionEnum.PushFragment:
          if (exec.currentOutput instanceof Array) {
            pushToStack(
              exec,
              new Fragment(exec.currentOutput, instruction.offset)
            );
          } else if (exec.currentOutput instanceof Fragment) {
            pushToStack(
              exec,
              new Fragment(
                exec.currentOutput.output,
                exec.currentOutput.offset + instruction.offset
              )
            );
          } else {
            throw Error('Invalid operation: Array or fragment expected');
          }
          break;

        case InstructionEnum.Enumerate:
          {
            const { regions, items, offset, itemKey } = instruction.tpl;

            let fragmentIdx: number = 0;
            if (!memory || memory[instruction.key] === undefined) {
              exec.valuesStack.push(exec.values);
              fragmentIdx = 0;
            } else {
              fragmentIdx = 1 + memory[instruction.key];
            }

            if (fragmentIdx >= regions.length) {
              if (memory) {
                delete memory[instruction.key];
              }
              instructionIdx += instruction.break;
              exec.values = exec.valuesStack.pop();
            } else {
              if (memory) {
                memory[instruction.key] = fragmentIdx;
              } else {
                memory = { [instruction.key]: fragmentIdx };
              }

              exec.values = regions[fragmentIdx];

              if (itemKey) {
                exec.values[itemKey] = items[fragmentIdx];
              }

              const fragmentOffset = offset + items.length * fragmentIdx;

              if (exec.currentOutput instanceof Array) {
                pushToStack(
                  exec,
                  new Fragment(exec.currentOutput, fragmentOffset)
                );
              } else if (exec.currentOutput instanceof Fragment) {
                pushToStack(
                  exec,
                  new Fragment(
                    exec.currentOutput.output,
                    exec.currentOutput.offset + fragmentOffset
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
            exec.memory = memory = {};
          }

          let operations: Generator<ReconcileOperation, void> = memory[key];

          if (!operations) {
            operations = reconcile(currentValue, tpl);
            memory[key] = operations;
          }

          while (true) {
            var next = operations.next();

            if (next.done) {
              delete memory[key];
              instructionIdx += instruction.break;
              break;
            }

            if (next.value.type === 'insert') {
              const { value, index } = next.value;

              const clone = tpl.items.map(cloneTemplateItem);
              const region = tpl.createRegion(value);
              tpl.regions.splice(index, 0, region);

              insertRegionOutput(exec.currentOutput, tpl, index, clone);
              pushRegionOutput(exec, tpl, index);
              exec.values = region;
              break;
            }

            if (next.value.type === 'update') {
              const { value, index } = next.value;

              const region = tpl.regions[index];
              region.key = value;

              if (tpl.itemKey) {
                region[tpl.itemKey] = value;
              }

              pushRegionOutput(exec, tpl, index);
              exec.values = region;
              break;
            }

            if (next.value.type === 'remove') {
              removeRegionOutput(exec.currentOutput, tpl, next.value.index);
              continue;
            }

            if (next.value.type === 'move') {
              moveRegionOutput(
                exec.currentOutput,
                tpl,
                next.value.from,
                next.value.to
              );
              continue;
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
            if (memory) {
              delete memory[instruction.key];
            }
            instructionIdx += instruction.jump;
          } else {
            if (memory) {
              memory[instruction.key] = fragmentIdx;
            } else {
              memory = { [instruction.key]: fragmentIdx };
            }

            const fragmentOffset = offset + items.length * fragmentIdx;

            if (exec.currentOutput instanceof Array) {
              pushToStack(
                exec,
                new Fragment(exec.currentOutput, fragmentOffset)
              );
            } else if (exec.currentOutput instanceof Fragment) {
              pushToStack(
                exec,
                new Fragment(
                  exec.currentOutput.output,
                  exec.currentOutput.offset + fragmentOffset
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
          exec.instructionIdx = instructionIdx + 1;
          return this.execute(program, exec, resolved);
        });
      }
    }
  }
}

export interface ExecuteState {
  currentOutput: any;
  instructionIdx?: number;
  memory?: Record<symbol, any>;
  outputStack?: Array<{ output: any; values: Record<symbol, any> }>;
  values: Record<symbol, any>;
  valuesStack: any[];
}

function pushToStack(state: ExecuteState, output: any) {
  if (state.outputStack === undefined) {
    state.outputStack = [{ output: state.currentOutput, values: state.values }];
  } else {
    state.outputStack.push({
      output: state.currentOutput,
      values: state.values,
    });
  }

  if (output instanceof Function) state.currentOutput = output();
  else state.currentOutput = output;
}

function popFromStack(state: ExecuteState) {
  if (state.outputStack === undefined || state.outputStack.length === 0) {
    throw Error('Output stack underflow');
  }
  const frame = state.outputStack.pop()!;
  state.currentOutput = frame.output;
  state.values = frame.values;
}

function getRegionSize(tpl: AutomatonTemplate) {
  return tpl.items.length;
}

function getRegionOffset(
  output: any[] | Fragment,
  tpl: AutomatonTemplate,
  index: number
) {
  const regionSize = getRegionSize(tpl);
  if (output instanceof Fragment) {
    return output.offset + index * regionSize;
  }
  return tpl.offset + index * regionSize;
}

function getRegionArray(output: any[] | Fragment) {
  return output instanceof Fragment ? output.output : output;
}

function pushRegionOutput(
  state: ExecuteState,
  tpl: AutomatonTemplate,
  index: number
) {
  const currentOutput = state.currentOutput;
  if (
    !(currentOutput instanceof Array) &&
    !(currentOutput instanceof Fragment)
  ) {
    throw Error('Failed to select region output: not supported output');
  }

  pushToStack(
    state,
    new Fragment(
      getRegionArray(currentOutput),
      getRegionOffset(currentOutput, tpl, index)
    )
  );
}

function insertRegionOutput(
  output: any[] | Fragment,
  tpl: AutomatonTemplate,
  index: number,
  clone: any[]
) {
  const target = getRegionArray(output);
  const offset = getRegionOffset(output, tpl, index);
  target.splice(offset, 0, ...clone);
}

function removeRegionOutput(
  output: any[] | Fragment,
  tpl: AutomatonTemplate,
  index: number
) {
  const target = getRegionArray(output);
  const offset = getRegionOffset(output, tpl, index);
  target.splice(offset, getRegionSize(tpl));
}

function moveRegionOutput(
  output: any[] | Fragment,
  tpl: AutomatonTemplate,
  from: number,
  to: number
) {
  if (from === to) {
    return;
  }

  const target = getRegionArray(output);
  const regionSize = getRegionSize(tpl);
  const fromOffset = getRegionOffset(output, tpl, from);
  let toOffset = getRegionOffset(output, tpl, to);
  const moved = target.splice(fromOffset, regionSize);

  if (from < to) {
    toOffset -= regionSize;
  }

  target.splice(toOffset, 0, ...moved);
}

export class Fragment {
  constructor(
    public output: any[],
    public offset: number
  ) {}
}

function execValue(exec: ExecuteState, key: symbol) {
  const value = exec.values[key];
  if (value !== undefined) {
    return value;
  }

  let index = exec.valuesStack.length;
  while (index--) {
    const values = exec.valuesStack[index];
    const value = values[key];
    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}
