import {
  Automaton,
  AutomatonTemplate,
  cloneTemplateItem,
  popScope as popTarget,
} from './automaton';
import { Conditional } from './core/if';
import { ForEachBody, ForEachComponent, Iterator } from './core/for';
import { ExecuteState, Sandbox } from './sandbox';
import {
  isLense,
  ItemState,
  Lense,
  resolveRootState,
  RootScope,
  Scope,
  State,
} from './state';
import {
  type AutomatonObject,
  events as objectEvents,
  type,
} from './json-automaton';

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
        const node = automaton.appendText(curr);
      } else if (curr.constructor === Number) {
        const node = automaton.appendText(curr);
      } else if (curr.constructor === Conditional) {
        const { expr, visible } = curr;

        if (isLense(expr)) {
          const conditional = automaton.pushConditional(expr, visible);
          viewStack.push(popTarget);
          viewStack.push(curr.body);
        } else if (visible) {
          automaton.pushRegion();
          viewStack.push(popTarget);
          viewStack.push(curr.body);
        }
      } else if (curr.constructor === ForEachComponent) {
        const { body, initial, expr: list } = curr;
        const state = resolveRootState(list);

        const tpl = automaton.pushTemplate();
        const iterator = buildIterator(tpl.scope, body, list);

        // viewStack.push(new InitializeState(state));

        viewStack.push(() =>
          automaton.registerReconciler(list, tpl, iterator.itemState)
        );

        if (initial) {
          const { itemState } = iterator;
          viewStack.push(() =>
            initializeIterator(sandbox, tpl, initial, itemState)
          );
        }
        viewStack.push(popTarget);
        viewStack.push(iterator.body);
      } else if (curr instanceof Function) {
        const result = curr();
        if (result instanceof Promise) {
          return result.then(() => traverse(currentScope));
        }
      } else if (curr instanceof SelectProperty) {
        automaton.selectProperty(curr.prop);
      } else if (isLense(curr)) {
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
      } else if (curr.constructor === Object) {
        const objectType = curr[type];
        automaton.appendObject(objectType);

        const eventsObject = curr[objectEvents];
        if (eventsObject) {
          const eventNames = Object.keys(eventsObject);
          for (const eventName of eventNames) {
            const handler = eventsObject[eventName];
            automaton.addEvent(eventName, handler);
          }
        }

        const properties = Object.keys(curr);

        viewStack.push(popTarget);

        for (let idx = properties.length - 1; idx >= 0; idx--) {
          const prop = properties[idx];
          const propValue = curr[prop];

          viewStack.push(propValue);
          viewStack.push(new SelectProperty(prop));
        }
      } else {
        throw Error('unsupported view');
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

function buildIterator(childScope: Scope, body: ForEachBody, list: Lense) {
  if (body instanceof Function) {
    const itemState = new ItemState<any>(childScope, list);
    return new Iterator(body(itemState), childScope, itemState);
  } else {
    return new Iterator(body, childScope);
  }
}

function initializeIterator(
  sandbox: Sandbox,
  tpl: AutomatonTemplate,
  initial: any[],
  itemState?: ItemState<any>
): void | Promise<void> {
  const currentOutput = sandbox.automaton.currentTarget.output;
  if (!(currentOutput instanceof Array)) throw Error('not supported');

  const itemProgram = itemState && tpl.patches.get(itemState);

  if (itemProgram) {
    for (let index = 0; index < initial.length; index++) {
      const value = initial[index];
      const clone = tpl.items.map(cloneTemplateItem);
      const region = tpl.createRegion(value);
      region[itemState.key] = value;

      tpl.regions.push(region);

      const exec: ExecuteState = {
        currentOutput: clone,
        values: region,
        valuesStack: [],
      };
      const result = sandbox.execute(itemProgram, exec, value);
      if (result instanceof Promise) {
        return result.then(async () => {
          currentOutput.push(...clone);

          for (
            let nextIndex = index + 1;
            nextIndex < initial.length;
            nextIndex++
          ) {
            const nextValue = initial[nextIndex];
            const nextClone = tpl.items.map(cloneTemplateItem);
            const nextRegion = tpl.createRegion(nextValue);
            nextRegion[itemState.key] = nextValue;

            tpl.regions.push(nextRegion);

            const nextExec: ExecuteState = {
              currentOutput: nextClone,
              values: nextRegion,
              valuesStack: [],
            };

            await sandbox.execute(itemProgram, nextExec, nextValue);
            currentOutput.push(...nextClone);
          }
        });
      }

      currentOutput.push(...clone);
    }
  } else {
    for (const value of initial) {
      tpl.clone(currentOutput, value);
    }
  }
}
