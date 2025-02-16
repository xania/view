import { Signal } from '../../../lib/reactivity/signal';
import { ReactiveGraph } from '../../../lib/reactivity/graph';

function when(condition: Signal<boolean>, body: ReactiveGraph) {
  return new Conditional(condition, body);
}

export class Conditional {
  public key: symbol = Symbol('conditional');
  constructor(
    public condition: Signal<boolean>,
    public body: ReactiveGraph
  ) {}
}
