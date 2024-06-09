import { Signal } from '../../../lib/reactivity/signal';
import { ReactiveGraph } from '../graph';

export function when(condition: Signal<boolean>, graph: ReactiveGraph) {
  return new Conditional(condition, graph);
}

export class Conditional {
  public key: symbol = Symbol('conditional');
  constructor(public condition: Signal<boolean>, public graph: ReactiveGraph) {}
}
