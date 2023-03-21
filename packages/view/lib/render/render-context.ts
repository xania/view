import { Scope, Graph, Stateful } from '../reactive';

export class RenderContext {
  public scope: Scope = new Scope();
  public graph = new Graph();
}
