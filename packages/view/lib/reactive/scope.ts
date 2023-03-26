import { Stateful } from '.';
import { StateOperator } from '../render/render-context';
export const scopeProp = Symbol('scope');

export class Scope {
  constructor() {}
  public readonly values = new Map<Stateful | StateOperator, any>();
}
