import { Scope } from './state';

export class Event {
  public readonly key: symbol = Symbol('event');
  constructor(
    public scope: Scope,
    public name: string,
    public handler: Function
  ) {}
}
