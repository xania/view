import { describe, expect, it, test } from 'vitest';
import {
  If,
  IfExpression,
  List,
  ListExpression,
  ListMutations,
  Sandbox,
  Signal,
  Value,
  signal,
} from '../reactivity';

const testRenderer = () => ({
  output: [] as string[],
  render(template: ViewTemplate) {
    switch (template.type) {
      case TemplateEnum.TextNode:
        this.output.push(template.text);
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

  it('list', () => {
    // arrange main graph
    const items = signal([1, 2, 3]);

    const output = testRender(
      List({
        source: items,
        children: (item) => item,
      })
    );
  });
});

type ReactiveAssembly = Instruction[];
type ReactiveVar = symbol;

interface Renderer {
  render(template: ViewTemplate): void;
}

function testRender(view: JSX.Children) {
  const program = compile(view);

  const renderer = testRenderer();
  run(program, renderer);
  return renderer.output;
}

function run(asm: ReactiveAssembly, renderer: Renderer) {
  const length = asm.length;
  const memory: { [key: ReactiveVar]: any } = {};
  const scopeStack = [];
  let scope: any = null;
  let cursor = 0;
  while (cursor < length) {
    const instruction = asm[cursor];
    switch (instruction.type) {
      case InstructionEnum.Render:
        renderer.render(instruction.template);
        cursor++;
        break;
      case InstructionEnum.Jump:
        cursor = instruction.address;
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
            cursor = instruction.jump;
            scope = list[iterator];
          } else {
            cursor++;
          }
        } else {
          cursor = instruction.jump;
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
      const { initial } = curr;
      program.push({
        type: InstructionEnum.Render,
        template: {
          type: TemplateEnum.TextNode,
          text: initial as string,
        },
      });
    } else if (curr instanceof ListExpression) {
      const { children, source } = curr;
      if (source instanceof ListMutations) {
      } else if (source instanceof Signal) {
        const listItem = signal();

        const { initial } = source;
        if (initial) {
          program.push({
            type: InstructionEnum.State,
            key: source.key,
            value: initial,
          });
        }
        const startJump = {
          type: InstructionEnum.Jump,
          address: -1,
        } as const;
        program.push(startJump);
        stack.push(
          new ForEachBlock(
            {
              type: InstructionEnum.ForEach,
              jump: program.length,
              index: Symbol(),
              item: listItem.key,
              list: source.key,
            },
            startJump
          )
        );
        stack.push(children);

        scope = new CompileScope([listItem]);
      }
    } else if (curr instanceof BlockEnd) {
    } else if (curr instanceof ForEachBlock) {
      curr.startJump.address = program.length;
      program.push(curr.forEach);
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
  address: number;
}

interface StateInstruction {
  type: InstructionEnum.State;
  key: symbol;
  value: any;
}

interface ForEachInstruction {
  type: InstructionEnum.ForEach;
  jump: number; //
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
}

type ViewTemplate = TextNodeTemplate;

interface TextNodeTemplate {
  type: TemplateEnum;
  text: string;
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
  constructor(
    public forEach: ForEachInstruction,
    public startJump: JumpInstruction
  ) {}
}
