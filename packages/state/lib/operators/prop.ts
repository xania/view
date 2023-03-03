import { Rx } from '../rx';
import { State } from '../observable/state';
import { pushNode } from '../graph';

export class PropertyOperator<T, K extends keyof T = keyof T>
  implements Rx.PropertyOperator<T, K>
{
  type: Rx.StateOperatorType.Property = Rx.StateOperatorType.Property;

  constructor(public name: K, public target: Rx.Stateful<T[K]>) {}
}

export type PropertyFunction<T> = <K extends keyof T = keyof T>(
  this: Rx.Stateful<T>,
  name: K
) => Rx.Stateful<T[K]>;

export function prop<T, K extends keyof T>(
  this: Rx.Stateful<T>,
  name: K
): Rx.Stateful<T[K]> {
  const { snapshot } = this;
  const mappedValue =
    snapshot === undefined || snapshot === null ? undefined : snapshot[name];
  const target: any = new State<T[K]>(mappedValue);
  pushNode(this, target);
  const mop = new PropertyOperator<T>(name, target);
  const { operators } = this;
  if (operators) {
    operators.push(mop);
  } else {
    this.operators = [mop];
  }
  return target;
}
