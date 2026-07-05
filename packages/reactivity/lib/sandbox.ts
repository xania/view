import {
  Automaton,
  AutomatonTarget,
  AutomatonTemplate,
  cloneTemplateItem,
  AutomatonObject,
} from './automaton';
import { UpdateCommand } from './commands/update';
import { reconcile, ReconcileOperation } from './core/reconcile';
import { concatOptimized, appendStateRead } from './json-automaton';
import { events } from './json-automaton';
import { Event } from './event';
import { InstructionEnum, Program, type Instruction } from './program';
import {
  ItemState,
  Lense,
  mapValue,
  resolveRootState,
  Scope,
  State,
  Value,
} from './state';

export class Sandbox {
  public targetStack: AutomatonTarget[] = [];

  constructor(
    public automaton: Automaton,
    public currentScope: Scope
  ) {}

  pushTarget(nextTarget: AutomatonTarget) {
    this.targetStack.push(this.automaton.currentTarget);
    this.automaton.currentTarget = nextTarget;
  }

  dispatchEvent(target: any, eventName: string) {
    const eventsObject = target[events];
    if (!eventsObject) {
      throw Error('No events registered on target');
    }
    const handler = eventsObject[eventName];
    if (!handler) {
      return;
    }

    if (handler instanceof Function) {
      const result = handler.call(target);
      return this.process(result);
    }

    return this.process(handler);
  }

  process = (command?: UpdateCommand<any>): Promise<void> | void => {
    if (command instanceof Promise) {
      return command.then(this.process);
    }

    if (!(command instanceof UpdateCommand)) {
      return;
    }

    const newValue =
      command.value instanceof Function
        ? mapValue(
            this.rootValues[command.state.key] ?? command.state.initial,
            command.value
          )
        : command.value;

    return this.update(command.state, newValue);
  };

  public rootValues: Record<symbol, any> = {};
  private executeStates: Record<symbol, ExecuteState> = {};

  attachEvent(eventName: string, handler: Function): void {
    const { currentTarget } = this.automaton;
    const { output } = currentTarget;

    if (!(output instanceof AutomatonObject)) {
      throw Error('Cannot add event outside object context');
    }

    if (currentTarget.prop) {
      throw Error('Cannot add event while a property is selected');
    }

    const init = (currentTarget.init ??= []);
    const event = new Event(currentTarget.scope, eventName, handler);

    init.push({
      type: InstructionEnum.AttachEvent,
      event,
    });

    output.object[events] ??= {};
    output.object[events][eventName] = handler;
  }

  appendArray(): boolean | void {
    const nextTarget = this.automaton.appendArray();
    if (!nextTarget) {
      return;
    }

    this.pushTarget(nextTarget);
    return true;
  }

  appendObject(type?: string): void {
    this.pushTarget(this.automaton.appendObject(type));
  }

  pushRegion(visible: boolean | void = true): void {
    this.pushTarget(this.automaton.pushRegion(visible));
  }

  pushTemplate(): AutomatonTemplate {
    const target = this.automaton.pushTemplate();
    this.pushTarget(target);

    if (!target.output) {
      throw Error('automaton did not provide template target');
    }

    return target.output as AutomatonTemplate;
  }

  popTarget(): void {
    if (this.targetStack.length === 0) {
      throw Error('cannot pop out root');
    }

    const { currentTarget } = this.automaton;
    const { patches, init } = currentTarget;
    const parentTarget = this.targetStack.pop()!;

    if (init) {
      const parentInit = (parentTarget.init ??= []);
      parentInit.push(...currentTarget.traversal, ...init);

      let depth = getDepth(currentTarget.traversal);
      while (depth--) {
        parentInit.push({ type: InstructionEnum.PopOutput });
      }
    }

    if (patches) {
      for (const [state, updates] of patches) {
        if (state.scope.level > currentTarget.scope.level) {
          const scopePatches = (state.scope.patches ??= new Map());

          if (scopePatches.has(state)) {
            scopePatches.get(state)!.push(...updates);
          } else {
            scopePatches.set(state, updates.slice());
          }
        } else {
          const program: Instruction[] = currentTarget.traversal.slice();
          concatOptimized(program, updates);

          let depth = getDepth(currentTarget.traversal);
          while (depth--) {
            program.push({ type: InstructionEnum.PopOutput });
          }

          const parentPatches = (parentTarget.patches ??= new Map());

          if (parentPatches.has(state)) {
            parentPatches.get(state)!.push(...program);
          } else {
            parentPatches.set(state, program.slice());
          }
        }
      }
    }

    this.automaton.currentTarget = parentTarget;
  }

  registerReconciler<T>(
    list: Lense<T[]>,
    tpl: AutomatonTemplate,
    item?: ItemState<T>
  ) {
    const { currentTarget } = this.automaton;
    if (!(currentTarget.output instanceof Array)) {
      throw Error('output is not an array');
    }

    const offset = tpl.offset;
    tpl.itemKey ??= item?.key;

    currentTarget.patches ??= new Map();

    const listRoot = resolveRootState(list);

    if (!item || !tpl.patches.has(item)) {
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
          break: 2 + (currentTarget.init?.length ?? 0),
        }
      );

      if (currentTarget.init) {
        program.push(...currentTarget.init);
      }

      program.push(
        { type: InstructionEnum.PopOutput },
        {
          type: InstructionEnum.Jump,
          steps: -3 - (currentTarget.init?.length ?? 0),
        }
      );

      appendOrSetProgram(currentTarget, listRoot, program);
    }

    for (const [state, stateProgram] of tpl.patches) {
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
        currentTarget.patches ??= new Map();

        let parentProgram = currentTarget.patches.get(state);

        if (!parentProgram) {
          parentProgram = [];
          currentTarget.patches.set(state, parentProgram);
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

  update<T>(state: State<T>, newValue: Value<T>) {
    const { rootValues } = this;
    const oldValue = rootValues[state.key];
    const patches = this.automaton.currentTarget.patches;

    if (!patches) return;
    const program = patches.get(state);
    if (!program) return;

    if (oldValue === newValue) {
      return;
    }

    const execState = this.createExecuteState(rootValues);
    this.executeStates[state.key] = execState;

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

  private createExecuteState(
    values: Record<symbol, any>,
    instructionIdx?: number
  ): ExecuteState {
    return {
      currentOutput: this.automaton.currentTarget.output,
      instructionIdx,
      outputStack: [],
      values,
      valuesStack: [],
    };
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
          if (exec.currentOutput instanceof Fragment) {
            const idx = exec.currentOutput.offset + instruction.index;
            pushToStack(exec, exec.currentOutput.output[idx]);
          } else {
            pushToStack(exec, exec.currentOutput[instruction.index]);
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
        case InstructionEnum.AttachEvent:
          exec.currentOutput[events] = exec.currentOutput[events] || {};
          exec.currentOutput[events][instruction.event.name] =
            instruction.event;
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

    // exec.instructionIdx = program.length;
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

function appendOrSetProgram(
  target: AutomatonTarget,
  state: State,
  program: Instruction[]
) {
  target.patches ??= new Map();
  const existingProgram = target.patches.get(state);
  if (existingProgram) {
    existingProgram.push(...program);
  } else {
    target.patches.set(state, program);
  }
}
