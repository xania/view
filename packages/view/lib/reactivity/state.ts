import { UpdateStateCommand } from './command';
import { Reactive, Unwrap, Value } from './reactive';

export class State<T = any> extends Reactive<T> {
  constructor(public initial?: Value<T>) {
    super();
  }

  update(valueOrCompute: UpdateStateCommand<T>['valueOrCompute']) {
    return new UpdateStateCommand(this, valueOrCompute);
  }
}

export function useState<T>(): State<Unwrap<T>>;
export function useState<T>(value: T): State<Unwrap<T>>;
export function useState<T>(value?: T) {
  return new State(value);
}
