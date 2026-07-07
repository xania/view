import {
  Automaton,
  AutomatonObject,
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
  events as objectEvents,
  type as objectType,
  children as objectChildren,
} from './json-automaton';

export interface RenderOption {
  expand(renderState: RenderState, view: any): boolean;
}

export function render(
  view: any,
  automaton: Automaton,
  options?: RenderOption
): Promise<Sandbox> | Sandbox {
  const sandbox = new Sandbox(automaton, RootScope);

  if (view === undefined || view === null) {
    return sandbox;
  }

  const renderState: RenderState = {
    viewStack: [view],
    promises: [],
  };
  const retval = traverse(sandbox, renderState, options);

  if (retval instanceof Promise) {
    renderState.promises.push(retval);
  }

  if (renderState.promises.length) {
    return Promise.all(renderState.promises).then(() => sandbox);
  } else {
    return sandbox;
  }
}

export interface RenderState {
  viewStack: any[];
  promises: Promise<any>[];
}

export function traverse(
  sandbox: Sandbox,
  renderState: RenderState,
  options?: RenderOption
): void | Promise<void> {
  const { automaton } = sandbox;

  while (renderState.viewStack.length) {
    const curr = renderState.viewStack.pop()!;

    if (curr === null || curr === undefined) {
      continue;
    }

    if (curr instanceof Promise) {
      return curr.then((resolved) => {
        renderState.viewStack.push(resolved);
        return traverse(sandbox, renderState, options);
      });
    }

    if (options?.expand(renderState, curr)) {
      continue;
    }

    if (curr.constructor === String) {
      const node = automaton.appendText(curr);
    } else if (curr.constructor === Number) {
      const node = automaton.appendText(curr);
    } else if (curr.constructor === Conditional) {
      const { expr, visible } = curr;

      if (isLense(expr)) {
        sandbox.pushTarget(automaton.pushConditional(expr, visible));
        renderState.viewStack.push(popTarget);
        renderState.viewStack.push(curr.body);
      } else if (visible) {
        sandbox.pushRegion();
        renderState.viewStack.push(popTarget);
        renderState.viewStack.push(curr.body);
      }
    } else if (curr.constructor === ForEachComponent) {
      const { body, initial, expr: list } = curr;
      const state = resolveRootState(list);

      const tpl = sandbox.pushTemplate();

      const iterator = buildIterator(tpl.scope, body, list);

      // renderState.viewStack.push(new InitializeState(state));

      renderState.viewStack.push(() =>
        sandbox.registerReconciler(list, tpl, iterator.itemState)
      );

      if (initial) {
        const { itemState } = iterator;
        renderState.viewStack.push(() =>
          initializeIterator(sandbox, tpl, initial, itemState)
        );
      }
      renderState.viewStack.push(popTarget);
      renderState.viewStack.push(iterator.body);
    } else if (curr instanceof Function) {
      const result = curr();
      if (result instanceof Promise) {
        return result.then(() => traverse(sandbox, renderState, options));
      }
    } else if (curr instanceof SelectProperty) {
      curr.object.prop = curr.prop;
    } else if (isLense(curr)) {
      const { initial } = curr;

      if (initial instanceof Promise) {
        return initial.then((resolved) => {
          sandbox.appendValue(curr, resolved);
          return traverse(sandbox, renderState, options);
        });
      }

      sandbox.appendValue(curr, initial);
    } else if (curr instanceof InitializeState) {
      const { initial } = curr.expr;
      if (initial instanceof Promise) {
        return initial
          .then((res) => sandbox.update(curr.expr, res))
          .then((_) => traverse(sandbox, renderState, options));
      } else {
        sandbox.update(curr.expr, initial);
      }
    } else if (curr === popTarget) {
      sandbox.popTarget();
    } else if (curr.constructor === Array) {
      sandbox.appendArray();
      renderState.viewStack.push(popTarget);

      for (let i = curr.length - 1; i >= 0; i--) {
        const item = curr[i];
        if (item !== null && item !== undefined) {
          renderState.viewStack.push(item);
        }
      }
    } else if (curr.constructor === Object) {
      const type = curr[objectType];
      sandbox.appendObject(type);

      const automatonObject = automaton.currentTarget.output as AutomatonObject;

      const eventsObject = curr[objectEvents];
      if (eventsObject) {
        const eventNames = Object.keys(eventsObject);
        for (const eventName of eventNames) {
          const handler = eventsObject[eventName];
          sandbox.attachEvent(eventName, handler);
        }
      }

      renderState.viewStack.push(popTarget);

      const children = curr[objectChildren];
      if (children) {
        renderState.viewStack.push(children);
      }

      renderState.viewStack.push(
        new SelectProperty(automatonObject, undefined)
      );

      const properties = Object.keys(curr);
      for (let idx = properties.length - 1; idx >= 0; idx--) {
        const prop = properties[idx];
        const propValue = curr[prop];

        renderState.viewStack.push(propValue);
        renderState.viewStack.push(new SelectProperty(automatonObject, prop));
      }
    } else {
      throw Error('unsupported view');
    }
  }
}
class InitializeState {
  constructor(public expr: State<any>) {}
}

class SelectProperty {
  constructor(
    public object: AutomatonObject,
    public prop?: string
  ) {}
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
  if (!(currentOutput instanceof Array)) throw Error('output not supported');

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
