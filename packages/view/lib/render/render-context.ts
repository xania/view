import { Scope, Graph, Stateful } from '../reactive';

export class RenderContext {
  constructor(public scope: Scope, public graph: Graph) {}
}
