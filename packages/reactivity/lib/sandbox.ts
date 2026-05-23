import { Automaton, ITextNode, TextNodeUpdater } from './automaton';
import { Iterator } from './core/for';
import { CloneInstruction, InstructionEnum, Program } from './program';
import { Arrow, FuncArrow, RootScope, Scope, State, Value } from './state';

export class Sandbox {
  public values: Record<symbol, any> = {};
  public updates: Record<symbol, Program> = {};

  constructor(public automaton: Automaton) {}

  appendValue(s: State<any>, initial: any, property: string | undefined) {
    const { automaton, updates } = this;

    const program = automaton.appendValue(s.scope, initial, property);
    if (program) {
      updates[s.graph] = program;
    }
  }

  update<T>(state: State<T, any>, newValue: Value<T>) {
    const { graph, key } = state;
    const { values, updates, automaton } = this;
    const oldValue = values[state.key];

    if (oldValue === newValue) {
      return;
    }

    const program = this.updates[graph];

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
              const { object, property } = instruction;

              if (object instanceof Array) {
                object[property as number] = currentValue;
              } else if (object.update instanceof Function) {
                object.update(property, currentValue);
              } else {
                object[property] = currentValue;
              }
            }
            break;
          case InstructionEnum.UpdateMany:
            {
              const { objects, property } = instruction;

              for (const object of objects) {
                if (object instanceof Array) {
                  object[property as number] = currentValue;
                } else if (object.update instanceof Function) {
                  object.update(property, currentValue);
                } else {
                  object[property] = currentValue;
                }
              }
            }
            break;
          case InstructionEnum.UpdateCurrent:
            {
              const { property } = instruction;

              const object = automaton.currentTarget;

              if (object.update instanceof Function) {
                object.update(property, currentValue);
              } else {
                object[property] = currentValue;
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
          case InstructionEnum.Clone:
            if (!enumerator) {
              instructionIdx += instruction.jump;
            } else {
              const { index, items } = enumerator;
              if (index < items.length) {
                currentValue = items[index];
                enumerator.index = index + 1;
                instruction.template.clone();
              } else {
                instructionIdx += instruction.jump;
              }
            }
            break;

          case InstructionEnum.MoveNext:
            automaton.up();
            instructionIdx += instruction.steps;
            break;
        }
      }
    }
  }

  bindIterator(iter: Iterator<any>, template: CloneInstruction['template']) {
    const { expr } = iter;
    const { graph } = expr;
    const program = (this.updates[graph] ??= [
      {
        type: InstructionEnum.Write,
        key: graph,
        level: 0,
      },
    ]);

    compile(expr, program);

    const startIdx = program.length;
    program.push({
      type: InstructionEnum.ForEach,
      level: 0,
      exprKey: expr.key,
      itemState: iter.itemState?.key,
    });

    const itemUpdate = iter.itemState
      ? this.updates[iter.itemState.key]
      : undefined;

    program.push({
      type: InstructionEnum.Clone,
      level: 0,
      template,
      jump: (itemUpdate?.length ?? 0) + 1,
    });

    if (itemUpdate) {
      program.push(...itemUpdate);
    }

    program.push({
      type: InstructionEnum.MoveNext,
      level: 0,
      steps: startIdx - program.length,
    });
  }

  bindConditional(expr: State<boolean>, node: any) {
    const { graph } = expr;
    const program = (this.updates[graph] ??= [
      {
        type: InstructionEnum.Write,
        key: graph,
        level: 0,
      },
    ]);

    compile(expr, program);
    program.push({
      type: InstructionEnum.Show,
      level: 0,
      node,
    });
  }

  bindTextNode(
    state: State<any, any>,
    textNode: ITextNode | TextNodeUpdater
  ): void | Promise<void> {
    let value: any = undefined;

    const { graph, arrows } = state;
    const program = (this.updates[graph] ??= [
      {
        type: InstructionEnum.Write,
        key: graph,
        level: 0,
      },
    ]);

    compile(state, program);

    if (textNode instanceof Function) {
      program.push({
        type: InstructionEnum.Effect,
        level: state.level,
        func: textNode,
      });
    } else
      program.push({
        type: InstructionEnum.SetText,
        node: textNode,
        level: state.level,
      });

    this.values[graph] = value;

    let stateValue = state.initial;
    if (stateValue === null || stateValue === undefined) {
      // ignore
    } else if (stateValue instanceof Promise) {
      return stateValue.then((resolved) => {
        if (resolved !== null && resolved !== undefined) {
          if (textNode instanceof Function) textNode(resolved);
          else textNode.nodeValue = resolved as string;
        }
      });
    } else {
      if (textNode instanceof Function) textNode(stateValue);
      else textNode.nodeValue = stateValue as string;
    }

    if (!arrows) return;

    const queue: Arrow[] = arrows;
    for (let i = 0; i < queue.length; i++) {
      const curr = queue[i];

      // if (curr instanceof State) {
      //   value = curr.initial;
      //   this.values[key] = value;
      //   // } else if (curr instanceof Composed) {
      //   //   queue.push(...curr.signals);
      // } else {
      //   throw new Error('Not Yet Supported');
      // }
    }

    return value;
  }
}

export function compile(state: State<any, any>, program: Program) {
  let s: State<any, any> | undefined = state;

  while (s) {
    let index = 0;
    while (index < program.length) {
      const curr = program[index];
      const { type } = curr;
      if (curr.level > s.level) {
        break;
      }
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
        level: s.level,
      });
    }

    if (arrows) {
      for (let i = arrows.length - 1; i >= 0; i--) {
        const arr = arrows[i];
        if (arr instanceof FuncArrow) {
          partial.push({
            type: InstructionEnum.Map,
            func: arr.func,
            level: s.level,
          });
        }
      }
    }

    if (parent) {
      partial.push({
        type: InstructionEnum.Write,
        key: s.key,
        level: s.level,
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
