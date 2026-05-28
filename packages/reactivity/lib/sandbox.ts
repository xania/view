import { JsonAutomaton } from './json';
import { InstructionEnum, Program } from './program';
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
          case InstructionEnum.Update:
            {
              const { property } = instruction;
              const output =
                instruction.target ?? automaton.currentTarget.output;

              if (output instanceof Array) {
                output[property as number] = currentValue;
              } else if (
                'update' in output &&
                output.update instanceof Function
              ) {
                output.update(property, currentValue);
              } else {
                const data = output as Record<string | number, any>;
                data[property] = currentValue;
              }
            }
            break;
          case InstructionEnum.UpdateMany:
            {
              const { targets, property } = instruction;

              for (const target of targets) {
                const data = target;

                if (data instanceof Array) {
                  data[property as number] = currentValue;
                } else if (
                  'update' in data &&
                  data.update instanceof Function
                ) {
                  data.update(property, currentValue);
                } else {
                  const target = data as Record<string | number, any>;
                  target[property] = currentValue;
                }
              }
            }
            break;
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
            } else {
              return traverse(currentValue, instructionIdx + 1, {
                items: currentValue,
                index: 0,
              });
            }

            break;
          case InstructionEnum.MoveNext:
            if (!enumerator) {
              instructionIdx += instruction.jump;
            } else {
              const { index, items } = enumerator;
              if (index < items.length) {
                currentValue = items[index];
                enumerator.index = index + 1;
              } else {
                instructionIdx += instruction.jump;
              }
            }
            break;
          case InstructionEnum.Clone:
            instruction.template.clone();
            break;

          case InstructionEnum.PopTarget:
            automaton.popTarget();
            break;

          case InstructionEnum.Jump:
            instructionIdx += instruction.steps;
            break;
          default:
            console.warn(
              `instruction type not supported ${InstructionEnum[type]}`
            );
            break;
        }
      }
    }
  }

  // bindConditional(expr: State<boolean>, node: any) {
  //   const { graph } = expr;
  //   const program = (this.automaton.events[graph] ??= [
  //     {
  //       type: InstructionEnum.Write,
  //       key: graph,
  //     },
  //   ]);

  //   compile(expr, program);
  //   program.push({
  //     type: InstructionEnum.Show,
  //     node,
  //   });
  // }

  // bindTextNode(
  //   state: State<any, any>,
  //   textNode: ITextNode | TextNodeUpdater
  // ): void | Promise<void> {
  //   return;
  //   let value: any = undefined;

  //   const { graph, arrows } = state;
  //   const program = (this.automaton.events[graph] ??= [
  //     {
  //       type: InstructionEnum.Write,
  //       key: graph,
  //     },
  //   ]);

  //   compile(state, program);

  //   if (textNode instanceof Function) {
  //     program.push({
  //       type: InstructionEnum.Effect,
  //       func: textNode,
  //     });
  //   } else
  //     program.push({
  //       type: InstructionEnum.SetText,
  //       node: textNode,
  //     });

  //   this.values[graph] = value;

  //   let stateValue = state.initial;
  //   if (stateValue === null || stateValue === undefined) {
  //     // ignore
  //   } else if (stateValue instanceof Promise) {
  //     return stateValue.then((resolved) => {
  //       if (resolved !== null && resolved !== undefined) {
  //         if (textNode instanceof Function) textNode(resolved);
  //         else textNode.nodeValue = resolved as string;
  //       }
  //     });
  //   } else {
  //     if (textNode instanceof Function) textNode(stateValue);
  //     else textNode.nodeValue = stateValue as string;
  //   }

  //   if (!arrows) return;

  //   const queue: Arrow[] = arrows;
  //   for (let i = 0; i < queue.length; i++) {
  //     const curr = queue[i];

  //     // if (curr instanceof State) {
  //     //   value = curr.initial;
  //     //   this.values[key] = value;
  //     //   // } else if (curr instanceof Composed) {
  //     //   //   queue.push(...curr.signals);
  //     // } else {
  //     //   throw new Error('Not Yet Supported');
  //     // }
  //   }

  //   return value;
  // }
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
