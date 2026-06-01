import { Fragment } from './execute';
import { JsonAutomaton } from './json';
import { InstructionEnum, type Program } from './program';
import { FuncArrow, State, Value } from './state';

export class Sandbox {
  public values: Record<symbol, any> = {};

  constructor(public automaton: JsonAutomaton) {}

  update<T>(state: State<T, any>, newValue: Value<T>) {
    const { graph, key } = state;
    const { values, automaton } = this;
    const oldValue = values[state.key];

    if (oldValue === newValue) {
      return;
    }

    if (!this.automaton.events) return;

    const program = this.automaton.events[graph];

    if (!program) return;

    let stateIdx = 0;

    for (; stateIdx < program.length; stateIdx++) {
      const instruction = program[stateIdx];
      const { type } = instruction;
      if (type === InstructionEnum.Write && instruction.key === key) {
        break;
      }
    }

    if (stateIdx >= program.length) {
      stateIdx = 0;
    }

    const promises: Promise<void>[] = [];

    let currentOutput = this.automaton.rootOutput as any;

    traverse(newValue, stateIdx);

    if (promises.length) {
      return Promise.all(promises);
    }

    function traverse(
      currentValue: any,
      instructionIdx: number,
      enumerator?: Enumerator
    ): Promise<void> | void {
      for (; instructionIdx < program.length; instructionIdx++) {
        const instruction = program[instructionIdx];
        const { type } = instruction;

        switch (type) {
          case InstructionEnum.Read:
            currentValue = values[instruction.key];
            break;
          case InstructionEnum.Write:
            values[instruction.key] = currentValue;
            break;
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
            const output = instruction.output ?? currentOutput;

            if (output instanceof Array) {
              throw Error('not an object');
              // output[property as number] = currentValue;
            } else if (
              'update' in output &&
              output.update instanceof Function
            ) {
              output.update(property, currentValue);
            } else {
              const data = output as Record<string | number | symbol, any>;
              data[property] = currentValue;
            }
            break;

          // case InstructionEnum.UpdateMany:
          //   {
          //     const { regions, property } = instruction;

          //     for (const target of regions) {
          //       const data = target;

          //       if (data instanceof Array) {
          //         data[property as number] = currentValue;
          //       } else if (
          //         'update' in data &&
          //         data.update instanceof Function
          //       ) {
          //         data.update(property, currentValue);
          //       } else {
          //         const target = data as Record<string | number, any>;
          //         target[property] = currentValue;
          //       }
          //     }
          //   }
          //   break;
          case InstructionEnum.SetText:
            const { node } = instruction;
            if (currentValue instanceof Promise) {
              promises.push(
                currentValue.then((resolved) => (node.nodeValue = resolved))
              );
            } else {
              node.nodeValue = currentValue;
            }
            break;
          case InstructionEnum.Map:
            if (currentValue instanceof Promise) {
              currentValue = currentValue.then((resolved) =>
                instruction.func(resolved)
              );
            } else {
              currentValue = instruction.func(currentValue);
            }
            break;
          case InstructionEnum.Effect:
            if (currentValue instanceof Promise) {
              promises.push(currentValue.then(instruction.func));
            } else {
              instruction.func(currentValue);
            }
            break;
          case InstructionEnum.Show:
            instruction.node.show(currentValue);
            break;

          case InstructionEnum.ForEach:
            if (currentValue instanceof Promise) {
              throw new Error('Not Yet Supported');
            } else if (currentValue.length > 0) {
              return traverse(currentValue, instructionIdx + 1, {
                items: currentValue,
                index: 0,
              });
            } else {
              instructionIdx += instruction.jump;
            }
            break;
          case InstructionEnum.MoveNext:
            if (!enumerator) {
              instructionIdx += instruction.jump;
            } else if (currentOutput instanceof Fragment) {
              const { index, items } = enumerator;
              const { regions } = instruction;
              if (index < items.length) {
                currentValue = items[index];
                if (index >= regions.length) {
                  instruction.template.clone();
                }
                const offset = regions[index];
                currentOutput.offset = offset;
                enumerator.index = index + 1;
              } else {
                instructionIdx += instruction.jump;
              }
            } else {
              throw Error('not a region');
            }
            break;
          case InstructionEnum.PopTarget:
            automaton.popTarget();
            break;

          case InstructionEnum.Jump:
            instructionIdx += instruction.steps;
            break;
          case InstructionEnum.SelectFragment:
            if (currentOutput instanceof Array) {
              currentOutput = new Fragment(currentOutput, instruction.index);
            } else {
              throw Error('not an array');
            }
            break;

          case InstructionEnum.SelectFragments:
            if (currentOutput instanceof Array) {
              const fragment = new Fragment(currentOutput, 0);
              for (const idx of instruction.indices) {
                fragment.offset = idx;
                currentOutput = fragment;
                traverse(currentValue, instructionIdx + 1);
              }
              return;
            } else {
              throw Error('not an array');
            }

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
          case InstructionEnum.UpdateRegions:
            const array =
              currentOutput instanceof Fragment
                ? currentOutput.output
                : (currentOutput as any[]);

            for (const offset of instruction.regions) {
              const idx = offset + instruction.index;
              array[idx] = currentValue;
            }

            break;

          // case InstructionEnum.NextSibling:
          //   currentOutput = {
          //     output: currentOutput.output,
          //     index: instruction.index,
          //   };
          //   break;

          default:
            const unsupportedType = InstructionEnum[type];
            console.warn(`instruction type not supported ${unsupportedType}`);
            break;
        }
      }
    }
  }
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

type Enumerator = {
  items: any[];
  index: number;
};
