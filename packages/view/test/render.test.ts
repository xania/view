import { describe, expect, it, test } from 'vitest';
import {
  If,
  IfExpression,
  List,
  ListExpression,
  Sandbox,
  Signal,
  Value,
  signal,
} from '../reactivity';
import { cpush } from '../lib/utils/collection';
import { smap } from '../lib/seq/map';

const testRenderer = () => ({
  output: [] as string[],
  render(template: ViewTemplate) {
    switch (template.type) {
      case TemplateEnum.TextNode:
        this.output.push(template.text);
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

type Assembly = Instruction[];

interface Renderer {
  render(template: ViewTemplate): void;
}

function testRender(view: JSX.Children) {
  const program = compile(view);
  expect(program).toHaveLength(2);

  const renderer = testRenderer();
  run(program, renderer);
  return renderer.output;
}

function run(program: Assembly, renderer: Renderer) {
  const length = program.length;
  const memory: { [key: symbol]: any } = {};
  for (let i = 0; i < length; i++) {
    const instruction = program[i];
    switch (instruction.type) {
      case InstructionEnum.Render:
        renderer.render(instruction.template);
        break;
      case InstructionEnum.Branch:
        const condition = memory[instruction.condition] ?? instruction.initial;
        if (!condition) {
          i += instruction.jump;
        }
        break;
    }
  }
}

function compile(view: JSX.Children): Assembly {
  const program: Assembly = [];
  const stack = [view];
  while (stack.length) {
    const curr = stack.pop()!;
    if (curr instanceof Array) {
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
      program.push({
        type: InstructionEnum.Branch,
        condition: condition.key,
        initial: condition.initial,
        jump: block.length,
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
      const { children } = curr;
      if (children) {
        const listItem = signal();
        const itemTemplate = smap(children, identity, listItem);
        compile(itemTemplate as any);
      }
    } else {
      debugger;
    }
  }

  return program;
}

const identity = <T extends (...args: any[]) => any>(x: T) => x();

type Instruction = RenderInstruction | BranchInstruction;

interface BranchInstruction {
  type: InstructionEnum.Branch;
  condition: symbol;
  initial?: Value<boolean>;
  jump: number; // number of instruction to skip when condition is false
}

interface RenderInstruction {
  type: InstructionEnum.Render;
  template: ViewTemplate;
}

enum InstructionEnum {
  Render = 0,
  Branch,
}

type ViewTemplate = TextNodeTemplate;

interface TextNodeTemplate {
  type: TemplateEnum;
  text: string;
}

enum TemplateEnum {
  TextNode = 0,
}
