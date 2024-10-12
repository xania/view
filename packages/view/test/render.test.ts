import { describe, expect, it, test } from 'vitest';
import {
  If,
  IfExpression,
  List,
  ListExpression,
  ListMutations,
  Signal,
  State,
  signal,
} from '../reactivity';
import {
  DomDescriptorType,
  isDomDescriptor,
} from '../lib/intrinsic/descriptors';

enum DomNodeEnum {
  TextNode,
}

type DomNode = DomTextNode;

interface DomTextNode {
  type: DomNodeEnum.TextNode;
  content: string | number;
}

function textNode(content: string | number): DomNode {
  return { type: DomNodeEnum.TextNode, content };
}

describe('renderer', () => {
  test.each([1, 2, 3])('if static %i', (n: number) => {
    // arrange main graph
    const isEven = (n & 1) === 0;
    const s = signal(isEven);
    const target = new TargetElement();

    testRender(
      If({
        condition: s,
        children: [123],
      }),
      target
    );
    expect(target.childNodes).toHaveLength(isEven ? 1 : 0);
  });

  it('reactive content', () => {
    // arrange main graph
    const s = signal(false);
    const target = new TargetElement();

    const sandbox = testRender(
      If({
        condition: s,
        children: [123],
      }),
      target
    );

    expect(target.childNodes).toHaveLength(0);
    sandbox.update(s, true);

    expect(target.childNodes).toHaveLength(1);
  });

  it('list output', () => {
    // arrange main graph
    const items = signal([1, 2, 3]);
    const target = new TargetElement();

    const sandbox = testRender(
      List({
        source: items,
        children: ['-', (item: Signal) => item],
      }),
      target
    );

    expect(target.childNodes).toEqual(['-', 1, '-', 2, '-', 3].map(textNode));
  });
});

type ReactiveAssembly = Instruction[];
type ReactiveVar = symbol;

interface Renderer {
  render(template: ViewTemplate, memory: ReactiveMemory): void;
}

function testRender(view: JSX.Children, target: TargetElement) {
  const program = compile(view);

  const sandbox = new Sandbox(target, {});
  run(program, sandbox);

  return sandbox;
}

type ReactiveMemory = { [key: ReactiveVar]: any };

class TargetElement {
  public childNodes: DomNode[] = [];
  appendChild(node: DomNode): void {
    this.childNodes.push(node);
  }
}

class RenderScope {
  constructor(public target: TargetElement) {}
}

function run(asm: ReactiveAssembly, sandbox: Sandbox) {
  const length = asm.length;
  const scopeStack: RenderScope[] = [];
  let scope: RenderScope = sandbox;
  let cursor = 0;
  const { memory } = sandbox;
  while (cursor < length) {
    const instruction = asm[cursor];
    switch (instruction.type) {
      case InstructionEnum.StepOut:
        if (scopeStack.length) {
          scope = scopeStack.pop()!;
        } else {
          scope = sandbox;
        }
        cursor++;
        break;
      case InstructionEnum.Render:
        sandbox.render(instruction.template, scope);
        cursor++;
        break;
      case InstructionEnum.Jump:
        cursor = instruction.addr;
        break;
      case InstructionEnum.Branch:
        scopeStack.push(scope);
        scope = new RenderScope(scope.target);
        sandbox.updates[instruction.condition] = {
          asm,
          start: cursor + 1,
          end: cursor + instruction.jump,
          scope,
        };
        const condition = memory[instruction.condition];
        if (!condition) {
          cursor += instruction.jump;
          sandbox.dispose(scope);
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
            memory[instruction.item] = undefined; // free up for GC to collect
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
      program.push({
        type: InstructionEnum.StepOut,
      });
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
        const listItem = signal();

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
    } else if (isDomDescriptor(curr)) {
      switch (curr.type) {
        case DomDescriptorType.Element:
          console.log(123);
          break;
        default:
          debugger;
          break;
      }
    } else {
      debugger;
    }
  }

  return program;
}

type Instruction =
  | RenderInstruction
  | BranchInstruction
  | ForEachInstruction
  | StateInstruction
  | JumpInstruction
  | StepOutInstruction;

interface StepOutInstruction {
  type: InstructionEnum.StepOut;
}
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
  StepOut = 6,
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
  constructor(
    public forEach: ForEachInstruction,
    public startAddr: number
  ) {}
}

type SandboxUpdates = {
  [key: ReactiveVar]: {
    asm: ReactiveAssembly;
    start: number;
    end: number;
    scope: RenderScope;
  };
};
class Sandbox {
  public readonly updates: SandboxUpdates = {};
  constructor(
    public target: TargetElement,
    public memory: ReactiveMemory
  ) {}

  render(template: ViewTemplate, scope: RenderScope) {
    switch (template.type) {
      case TemplateEnum.TextNode:
        const { text } = template;
        scope.target.appendChild(
          textNode(
            text instanceof Signal
              ? (this.memory[text.key] ?? text.initial)
              : text
          )
        );
        break;
      default:
        break;
    }
  }

  update<T>(s: State<T>, newValue: T) {
    let { asm, start: i, end, scope } = this.updates[s.key];

    while (i < end) {
      const instruction = asm[i++];
      switch (instruction.type) {
        case InstructionEnum.Render:
          this.render(instruction.template, scope);
          break;
      }
    }
  }

  dispose(scope: RenderScope) {
    console.log(scope);
  }
}
