import { Scope } from './scope';

export class Unresolved {
  constructor(public name: string, public scope: Scope) {}
}
