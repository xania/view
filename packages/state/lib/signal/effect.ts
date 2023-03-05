import { connect } from '../graph';
import { pushOperator } from '../operators/map';
import { Rx } from '../rx';
import { syncUpTo } from '../sync';
import { recompute } from './computed';

export function effect(fn: () => void, label?: string) {
  const effect = new Effect(fn, label);
  recompute.apply(effect);
  return effect;
}

export class Effect implements Rx.Stateful<void> {
  constructor(public fn: () => void, public label?: string) {}

  dirty: Rx.Stateful['dirty'] = false;
  key = Symbol();
  readonly type = Rx.StateOperatorType.Effect;
  target = this;
  version = 1;

  dependsOn(dep: Rx.Stateful) {
    const { key } = this;

    if (!(dep as any)[key]) {
      connect(dep, this);
      pushOperator(dep, this);
    }
    (dep as any)[key] = this.version;
  }

  run() {
    recompute.apply(this);
  }
}
