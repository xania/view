import { Rx } from '../rx';
import { State } from '../observable/state';
import { pushOperator } from './map';

export class PropertyOperator<T, K extends keyof T = keyof T>
  implements Rx.PropertyOperator<T, K>
{
  type: Rx.StateOperatorType.Property = Rx.StateOperatorType.Property;

  constructor(public name: K, public target: Rx.Stateful<T[K]>) {}
}

export type PropertyFunction<T> = <K extends keyof T = keyof T>(
  this: Rx.Stateful<T>,
  name: K
) => State<T[K]>;

export function prop<T, K extends keyof T>(
  this: Rx.Stateful<T>,
  name: K
): State<T[K]> {
  const { snapshot } = this;
  const mappedValue =
    snapshot === undefined || snapshot === null ? undefined : snapshot[name];
  const target = new State<T[K]>(mappedValue);
  const mop = new PropertyOperator<T>(name, target as any);

  pushOperator(this, mop);

  return target;
}
