import { Program, Scope } from './program';
import { Reactive } from './reactive';

export class Each<T> extends Reactive<T> {
  public body: Program = new Program();
  constructor(public source: Reactive<T[]>, public factory: ScopeFactory<T>) {
    super();
  }
}

export function each<T>(source: Reactive<T[]>, scopeFactory: ScopeFactory<T>) {
  return new Each(source, scopeFactory);
}

interface ScopeFactory<T> {
  (value: T): Scope;
}
