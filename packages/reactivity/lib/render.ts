// import { DomDescriptorType, isDomDescriptor } from '../intrinsic';
import { ITemplate, popScope as popTarget } from './automaton';
import { Conditional } from './core/if';
import { ForEachComponent, Iterator } from './core/for';
import { Sandbox } from './sandbox';
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
        const { expr } = curr;

        if (expr instanceof State) {
          automaton.pushRegion(expr);
        } else {
          debugger;
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
        Sandbox.bindIterator(curr, tpl, events);

        viewStack.push(new InitializeState(curr.expr));
        viewStack.push(popTarget);
        viewStack.push(curr.body);
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
