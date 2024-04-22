import { Property, Reactive, Value, mapValue } from '../../reactivity';
import { Scoped } from './operations';

export class ExecutionScope {
  [p: number | symbol]: any;

  constructor(public context?: any) {}

  emit<T>(
    state: Reactive<T>,
    newValueOrReduce: Value<T> | ((value?: T) => Value<T>)
  ): JSX.MaybeArray<Promise<any>> | void {
    const currentValue = this[state.key] ?? state.initial;

    const newValue =
      newValueOrReduce instanceof Function
        ? mapValue(currentValue, newValueOrReduce)
        : newValueOrReduce;

    if (newValue === currentValue) {
      return;
    }

    this[state.key] = newValue;
  }

  track(state: Reactive) {
    if (this[state.key] !== undefined) {
      return this[state.key];
    } else if (state instanceof Scoped) {
      return this.context;
    }

    if (state instanceof Property) {
      const obj: any = this.track(state.parent);
      return obj[state.name];
    }

    return state.initial;
  }

  resolve(state: Reactive) {
    const scope = this;
    if (scope[state.key] !== undefined) {
      return scope[state.key];
    }

    if (state instanceof Property) {
      const obj: any = this.resolve(state.parent);
      return obj[state.name];
    } else if (state instanceof Scoped) {
      return scope.context;
    }

    return state.initial;
  }
}
