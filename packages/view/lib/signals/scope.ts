export class Scope {}

const stack: Scope[] = [];

export let currentScope = new Scope();

export function pushScope() {
  stack.push(currentScope);
  currentScope = new Scope();
}

export function popScope(): Scope {
  return stack.pop()!;
}
