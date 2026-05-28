// import { DomDescriptorType, isDomDescriptor } from '../intrinsic';
import { ITemplate, popScope as popTarget } from './automaton';
import { Conditional } from './core/if';
import { ForEachComponent, Iterator } from './core/for';
import { CloneInstruction, InstructionEnum } from './program';
import { compile, Sandbox } from './sandbox';
import { RootScope, Scope, State } from './state';
import { JsonAutomaton } from './json';

export function render(
  view: any,
  automaton: JsonAutomaton
): Promise<Sandbox> | Sandbox {
  const sandbox = new Sandbox(automaton);

  if (view === undefined || view === null) {
    return sandbox;
  }

  const viewStack = [view];

  const promises: Promise<any>[] = [];
  const retval = traverse(RootScope);

  if (retval instanceof Promise) {
    promises.push(retval);
  }

  if (promises.length) {
    return Promise.all(promises).then(() => sandbox);
  } else {
    return sandbox;
  }

  function traverse(currentScope: Scope): void | Promise<void> {
    while (viewStack.length) {
      const curr = viewStack.pop()!;
      if (curr === null || curr === undefined) {
        continue;
      }

      if (curr instanceof Promise) {
        return curr.then((resolved) => {
          viewStack.push(resolved);
          return traverse(currentScope);
        });
      }

      if (curr.constructor === String) {
        const node = automaton.appendText(curr);
      } else if (curr.constructor === Number) {
        const node = automaton.appendText(curr);
      } else if (curr.constructor === Conditional) {
        const { expr, visible } = curr;

        const region = automaton.pushRegion(visible);
        const events = (automaton.currentTarget.events ??= {});

        if (expr instanceof State) {
          events[expr.key] = [
            {
              type: InstructionEnum.Show,
              node: region,
            },
          ];
        }
        viewStack.push(popTarget);
        viewStack.push(curr.body);
      } else if (curr.constructor === ForEachComponent) {
        const { body, expr } = curr;

        const scope = RootScope;

        const childScope = scope.pushScope();

        if (body instanceof Function) {
          const itemState = childScope.state();
          viewStack.push(
            new Iterator(expr, body(itemState), childScope, itemState)
          );
        } else {
          viewStack.push(new Iterator(expr, body, childScope));
        }
      } else if (curr.constructor === Iterator) {
        const tpl = automaton.pushTemplate(
          curr.expr,
          curr.scope,
          curr.itemState
        );

        const events = (automaton.currentTarget.events ??= {});

        viewStack.push(new InitializeState(curr.expr));
        viewStack.push(() => bindIterator(curr, tpl, events));
        viewStack.push(popTarget);
        viewStack.push(curr.body);
      } else if (curr instanceof Function) {
        curr();
      } else if (curr instanceof SelectProperty) {
        automaton.selectProperty(curr.prop);
      } else if (curr instanceof State) {
        const { initial } = curr;

        if (initial instanceof Promise) {
          return initial.then((resolved) => {
            automaton.appendValue(curr, resolved);
            return traverse(currentScope);
          });
        }

        automaton.appendValue(curr, initial);
      } else if (curr instanceof InitializeState) {
        const { initial } = curr.expr;
        if (initial instanceof Promise) {
          return initial
            .then((res) => sandbox.update(curr.expr, res))
            .then((_) => traverse(currentScope));
        } else {
          sandbox.update(curr.expr, initial);
        }
      } else if (curr === popTarget) {
        automaton.popTarget();
      } else if (curr.constructor === Array) {
        automaton.appendArray();
        viewStack.push(popTarget);

        for (let i = curr.length - 1; i >= 0; i--) {
          const item = curr[i];
          if (item !== null && item !== undefined) {
            viewStack.push(item);
          }
        }
      } else {
        automaton.appendObject();

        const properties = Object.keys(curr);

        viewStack.push(popTarget);

        for (const prop of properties) {
          const propValue = curr[prop];
          viewStack.push(propValue);
          viewStack.push(new SelectProperty(prop));
        }
      }
    }
  }
}
class InitializeState {
  constructor(public expr: State<any>) {}
}

class SelectProperty {
  constructor(public prop: string) {}
}

function bindIterator(
  iter: Iterator<any>,
  template: CloneInstruction['template'],
  events: Record<string | number | symbol, any> | undefined
) {
  const { expr } = iter;
  const { graph } = expr;

  if (!events) return;

  const program = (events[graph] ??= [
    {
      type: InstructionEnum.Write,
      key: graph,
    },
  ]);

  compile(expr, program);

  const startIdx = program.length;
  program.push({
    type: InstructionEnum.ForEach,
    exprKey: expr.key,
    itemState: iter.itemState?.key,
  });

  const itemUpdate =
    iter.itemState && events ? events[iter.itemState.key] : undefined;

  program.push(
    {
      type: InstructionEnum.MoveNext,
      jump: (itemUpdate?.length ?? 0) + 3,
    },
    {
      type: InstructionEnum.Clone,
      template,
    }
  );

  if (itemUpdate) {
    program.push(...itemUpdate);
  }

  program.push({
    type: InstructionEnum.PopTarget, // pop region
  });

  program.push({
    type: InstructionEnum.Jump,
    steps: startIdx - program.length,
  });
}
