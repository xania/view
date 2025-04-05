// import { DomDescriptorType, isDomDescriptor } from '../intrinsic';
import { State, Signal, Value, Arrow, FuncArrow } from './signal';

export function render<TElement>(
  view: any,
  automaton: Automaton<TElement>
): Promise<Sandbox<TElement>> | Sandbox<TElement> {
  const sandbox = new Sandbox(automaton.current);

  if (view === undefined || view === null) {
    return sandbox;
  }

  const viewStack = [view];

  const containerStack: TElement[] = [];

  const promises: Promise<void>[] = [];
  const retval = loop();

  if (retval instanceof Promise) {
    promises.push(retval);
  }

  if (promises.length) {
    return Promise.all(promises).then(() => sandbox);
  } else {
    return sandbox;
  }

  function loop(): void | Promise<void> {
    while (viewStack.length) {
      const curr = viewStack.pop()!;
      if (curr === null || curr === undefined) {
        continue;
      } else if (curr instanceof Promise) {
        return curr.then((resolved) => {
          viewStack.push(resolved);
          return loop();
        });
      } else if (curr === popContainer) {
        automaton.up();
      } else if (curr.constructor === String) {
        automaton.appendText(curr);
      } else if (curr.constructor === Number) {
        automaton.appendText(curr);
      } else if (curr.constructor === Array) {
        for (let i = curr.length - 1; i >= 0; i--) {
          const item = curr[i];
          if (item !== null && item !== undefined) {
            viewStack.push(item);
          }
        }
      } else if (curr instanceof State) {
        const textNode = automaton.appendText('');
        const res = sandbox.bindTextNode(curr, textNode);
        if (res) {
          promises.push(res);
        }
      } else {
        const children = automaton.append(curr);
        viewStack.push(popContainer);
        if (
          children !== null &&
          children !== undefined &&
          children.length > 0
        ) {
          for (let i = children.length - 1; i >= 0; i--) {
            const item = children[i];
            if (item !== null && item !== undefined) {
              viewStack.push(item);
            }
          }
        }
      }

      // } else if (isDomDescriptor(curr)) {
      //   switch (curr.type) {
      //     case DomDescriptorType.Element:
      //       const { children, attrs } = curr;
      //       const element = nodeFactory.appendElement(
      //         container,
      //         curr.name,
      //         attrs
      //       );
      //       if (
      //         children !== null &&
      //         children !== undefined &&
      //         children.length > 0
      //       ) {
      //         containerStack.push(container);
      //         container = element;

      //         viewStack.push(popContainer);

      //         for (let i = children.length - 1; i >= 0; i--) {
      //           const item = children[i];
      //           if (item !== null && item !== undefined) {
      //             viewStack.push(item);
      //           }
      //         }
      //       }
      //       break;
      //   }
      // }
    }
  }
}

const popContainer = Symbol();

export type TextNodeUpdater = (nodeValue: any) => void;
export interface ITextNode {
  nodeValue: any;
}

// interface ViewNodeFactory<TElement> {
//   append<TContainer extends TElement>(
//     container: TContainer,
//     child: any
//   ): { element: TElement; children: any } | void;
//   // appendElement(
//   //   container: TElement,
//   //   name: string,
//   //   attrs: Record<string, any> | undefined
//   // ): TElement;
//   appendText(container: TElement, content?: ITextNode['nodeValue']): ITextNode;
// }

export interface Automaton<TElement> {
  readonly current: TElement;
  up(): void;
  append(child: any): any[] | void; // -> children
  appendText(content?: ITextNode['nodeValue']): ITextNode | TextNodeUpdater;
}

class Sandbox<TElement> {
  private values: Record<symbol, any> = {};
  private updates: Record<symbol, Program> = {};

  constructor(public root: TElement) {}

  update<T>(state: State<T, any>, newValue: Value<T>) {
    const { graph, key } = state;
    const { values } = this;
    const oldValue = values[state.key] ?? state.initial;

    if (oldValue === newValue) {
      return;
    }

    const program = this.updates[graph];

    // printProgram(program);

    let stateIdx = 0;

    for (; stateIdx < program.length; stateIdx++) {
      const instruction = program[stateIdx];
      const { type } = instruction;
      if (type === InstructionEnum.Write && instruction.key === key) {
        break;
      }
    }

    if (stateIdx >= program.length) {
      return;
    }

    const promises: Promise<void>[] = [];
    loop(newValue, stateIdx);

    if (promises.length) {
      return Promise.all(promises);
    }

    function loop(
      currentValue: any,
      instructionIdx: number
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
        }
      }
    }
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

type Program = Instruction[];

type Instruction =
  | StateInstruction
  | FuncInstruction
  | SetTextInstruction
  | ReadInstruction
  | EffectInstruction;

interface SetTextInstruction {
  type: InstructionEnum.SetText;
  level: number;
  node: ITextNode;
}
interface StateInstruction {
  type: InstructionEnum.Write;
  level: number;
  key: symbol;
}
interface ReadInstruction {
  type: InstructionEnum.Read;
  level: number;
  key: symbol;
}

interface FuncInstruction {
  type: InstructionEnum.Map;
  level: number;
  func: Function;
}

interface EffectInstruction {
  type: InstructionEnum.Effect;
  level: number;
  func: (x: any) => void | Promise<void>;
}

enum InstructionEnum {
  Write = 4356234 /* magic number */,
  Read,
  Map,
  Effect,
  SetText,
}

function compile(state: State<any, any>, program: Program) {
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

    program.splice(index, 0, ...partial);

    s = s.parent;
  }
}
function printProgram(program: Program) {
  for (const instruction of program) {
    console.log(InstructionEnum[instruction.type], instruction.level);
  }
}
