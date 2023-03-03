import { findLeft, findRight } from './graph';
import { Rx } from './rx';
import { Signal } from './signal';
import { sync } from './sync';

export type SyncScheduler = {
  schedule(...state: Rx.Stateful[]): void;
};

const stack: SyncScheduler[] = [];
export function schedule(x: Signal) {
  if (stack.length === 0) {
    sync([x]);
  } else {
    stack[stack.length - 1]!.schedule(x);
  }
}

export function batch(fn: Function) {
  const batch = new BatchScheduler();
  stack.push(batch);
  fn();
  if (batch !== stack.pop()) {
    throw new Error('unexpected stack element');
  }
  batch.flush();
}

export const DefaultSyncScheduler: SyncScheduler = {
  schedule(x) {
    sync([x]);
  },
};

export class BatchScheduler implements SyncScheduler {
  states: Rx.Stateful[] = [];

  schedule(state: Rx.Stateful) {
    for (let i = 0; i < this.states.length; i++) {
      const s = this.states[i];
      if (s === state) {
        return true;
      }
      if (findRight(s, state)) {
        return false;
      }
      if (findLeft(s, state)) {
        this.states[i] = state;
        return true;
      }
    }
    this.states.push(state);
    return true;
  }

  flush() {
    const { states } = this;
    sync(states);
    states.length = 0;
  }
}

export class AnimationScheduler implements SyncScheduler {
  states: Rx.Stateful[] = [];
  private _animationHndl: number = -1;

  schedule() {
    const { states } = this;
    states.push.apply(states, arguments as any);

    if (this._animationHndl < 0)
      this._animationHndl = requestAnimationFrame(this.flush);
  }

  cancel() {
    if (this._animationHndl < 0) cancelAnimationFrame(this._animationHndl);
  }

  flush = () => {
    sync(this.states);
    this._animationHndl = -1;
  };
}
