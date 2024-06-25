import { describe, expect, it, test } from 'vitest';
import {
  If,
  IfExpression,
  List,
  ListExpression,
  ListMutations,
  Signal,
  signal,
} from '../reactivity';

const testRenderer = () => ({
  output: [] as string[],
  render(template: ViewTemplate, memory: ReactiveMemory) {
    switch (template.type) {
      case TemplateEnum.TextNode:
        const { text } = template;
        if (text instanceof Signal) {
          this.output.push(memory[text.key] ?? text.initial);
        } else {
          this.output.push(text as string);
        }
        break;
      default:
        break;
    }
  },
});

describe('renderer', () => {
  test.each([1, 2, 3])('if %i', (n: number) => {
    // arrange main graph
    const isEven = (n & 1) === 0;
    const s = signal(isEven);

    const output = testRender(
      If({
        condition: s,
        children: [123],
      })
    );
    expect(output).toHaveLength(isEven ? 1 : 0);
  });

  it('list output', () => {
    // arrange main graph
    const items = signal([1, 2, 3]);

    const output = testRender(
      List({
        source: items,
        children: (item) => item,
      })
    );

    expect(output).toEqual(items.initial);
  });
});

type ReactiveAssembly = Instruction[];
type ReactiveVar = symbol;

interface Renderer {
  render(template: ViewTemplate, memory: ReactiveMemory): void;
}

function testRender(view: JSX.Children) {
  const program = compile(view);

  const renderer = testRenderer();
  run(program, renderer);
  return renderer.output;
}

type ReactiveMemory = { [key: ReactiveVar]: any };

function run(asm: ReactiveAssembly, renderer: Renderer) {
  const length = asm.length;
  const memory: ReactiveMemory = {};
  const scopeStack = [];
  let scope: any = null;
  let cursor = 0;
  while (cursor < length) {
    const instruction = asm[cursor];
    switch (instruction.type) {
      case InstructionEnum.Render:
        renderer.render(instruction.template, memory);
        cursor++;
        break;
      case InstructionEnum.Jump:
        cursor = instruction.addr;
        break;
      case InstructionEnum.Branch:
        const condition = memory[instruction.condition];
        if (!condition) {
          cursor += instruction.jump;
        } else {
          cursor++;
        }
        break;
      case InstructionEnum.ForEach:
        const list = memory[instruction.list];
        if (list instanceof Array) {
          const iterator = memory[instruction.index] | 0;
          memory[instruction.index] = iterator + 1;
          if (iterator < list.length) {
            memory[instruction.item] = list[iterator];
            cursor++;
          } else {
            cursor = instruction.breakAddr;
          }
        } else {
          cursor = instruction.breakAddr;
        }
        break;
      case InstructionEnum.State:
        const { value, key } = instruction;
        memory[key] = value;
        cursor++;
        break;
      default:
        cursor++;
        break;
    }
  }
}

function compile(view: JSX.Children): ReactiveAssembly {
  const program: ReactiveAssembly = [];
  const stack: any[] = [view];
  let scope: CompileScope = new CompileScope([]); // root
  while (stack.length) {
    const curr = stack.pop()!;
    if (curr instanceof Function) {
      stack.push(curr.call(null, scope.args));
    } else if (curr instanceof CompileScope) {
      scope = curr;
    } else if (curr instanceof Array) {
      for (let i = curr.length - 1; i >= 0; i--) {
        const item = curr[i];
        if (item !== null && item !== undefined) {
          stack.push(item);
        }
      }
    } else if (curr.constructor === Number) {
      program.push({
        type: InstructionEnum.Render,
        template: {
          type: TemplateEnum.TextNode,
          text: curr.toString(),
        },
      });
    } else if (curr.constructor === String) {
      program.push({
        type: InstructionEnum.Render,
        template: {
          type: TemplateEnum.TextNode,
          text: curr as string,
        },
      });
    } else if (curr instanceof IfExpression) {
      const { condition, children } = curr.props;
      const block = compile(children);
      if (condition.initial) {
        program.push(...block);
      }
      program.push({
        type: InstructionEnum.Branch,
        condition: condition.key,
        jump: block.length + 1,
      });
      program.push(...block);
    } else if (curr instanceof Signal) {
      program.push({
        type: InstructionEnum.Render,
        template: {
          type: TemplateEnum.TextNode,
          text: curr,
        },
      });
    } else if (curr instanceof ListExpression) {
      const { children, source } = curr;
      if (source instanceof ListMutations) {
      } else if (source instanceof Signal) {
        const listItem = new RenderScope();

        const { initial } = source;
        if (initial) {
          program.push({
            type: InstructionEnum.State,
            key: source.key,
            value: initial,
          });
        }
        const startAddr = program.length;
        const forEach = {
          type: InstructionEnum.ForEach,
          breakAddr: -1,
          index: Symbol(),
          item: listItem.key,
          list: source.key,
        } as const;

        stack.push(new ForEachBlock(forEach, startAddr));
        stack.push(children);

        program.push(forEach);

        scope = new CompileScope([listItem]);
      }
    } else if (curr instanceof BlockEnd) {
    } else if (curr instanceof ForEachBlock) {
      program.push({
        type: InstructionEnum.Jump,
        addr: curr.startAddr,
      });
      curr.forEach.breakAddr = program.length;
    } else {
      debugger;
    }
  }

  return program;
}

const identity = <T extends (...args: any[]) => any>(x: T) => x();

type Instruction =
  | RenderInstruction
  | BranchInstruction
  | ForEachInstruction
  | StateInstruction
  | JumpInstruction;

interface JumpInstruction {
  type: InstructionEnum.Jump;
  addr: number;
}

interface StateInstruction {
  type: InstructionEnum.State;
  key: symbol;
  value: any;
}

interface ForEachInstruction {
  type: InstructionEnum.ForEach;
  breakAddr: number; //
  index: ReactiveVar;
  list: ReactiveVar;
  item: ReactiveVar;
}
interface BranchInstruction {
  type: InstructionEnum.Branch;
  condition: ReactiveVar;
  jump: number; // number of instruction to skip when condition is false
}

interface RenderInstruction {
  type: InstructionEnum.Render;
  template: ViewTemplate;
}

enum InstructionEnum {
  Render = 0,
  Branch = 1,
  ForEach = 2,
  Jump = 3,
  State = 4,
  Update = 5,
}

type ViewTemplate = TextNodeTemplate;

interface TextNodeTemplate {
  type: TemplateEnum;
  text: string | Signal;
}

enum TemplateEnum {
  TextNode = 0,
}

class CompileScope {
  constructor(public args: any[]) {}
}

class BlockEnd {
  constructor(public instruction: { address: number }) {}
}

class ForEachBlock {
  constructor(public forEach: ForEachInstruction, public startAddr: number) {}
}

export class RenderScope extends Signal {
  constructor() {
    super(undefined, Symbol('render-scope'));
  }
}
