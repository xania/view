// import { DomDescriptorType, isDomDescriptor } from '../intrinsic';
import { Automaton, ITemplate, popScope as popTarget } from './automaton';
import { Conditional } from './core/if';
import { Iterator } from './core/for';
import { Sandbox } from './sandbox';
import { RootScope, Scope, State } from './state';

export function render(
  view: any,
  automaton: Automaton
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
        const node = automaton.appendText(currentScope, curr);
      } else if (curr.constructor === Number) {
        const node = automaton.appendText(currentScope, curr);
      } else if (curr.constructor === Conditional) {
        const { initial: visible } = curr.expr;

        const node = automaton.appendNode(
          visible instanceof Promise ? false : !!visible
        );
        sandbox.bindConditional(curr.expr, node);

        viewStack.push(popTarget);
        viewStack.push(curr.body);

        if (visible instanceof Promise) {
          promises.push(
            visible.then((resolved) => sandbox.update(curr.expr, resolved))
          );
        }
      } else if (curr.constructor === Iterator) {
        const tpl = automaton.pushTemplate(curr.scope);
        viewStack.push(new InitializeState(curr.expr));
        viewStack.push(popTarget);
        viewStack.push(new BindIterator(curr, tpl));
        viewStack.push(curr.body);
      } else if (curr instanceof BindIterator) {
        sandbox.bindIterator(curr.iterator, curr.template);
      } else if (curr instanceof State) {
        const { initial } = curr;

        if (initial instanceof Promise) {
          return initial.then((resolved) => {
            sandbox.appendValue(curr, resolved);
            return traverse(currentScope);
          });
        }

        sandbox.appendValue(curr, initial);
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
        const properties = Object.keys(curr);
        automaton.appendProperties(properties);

        for (const prop of properties) {
          const propValue = curr[prop];
          viewStack.push(popTarget);
          viewStack.push(propValue);
        }
      }
    }
  }
}
class InitializeState {
  constructor(public expr: State<any>) {}
}

class BindIterator {
  constructor(
    public iterator: Iterator<any>,
    public template: ITemplate
  ) {}
}
