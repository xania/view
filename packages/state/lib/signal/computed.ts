// import { UnwrapStates } from '../observable/combine-latest';
import { connect } from '../graph';
import { subscribe } from '../observable/subscribe';
import { pushOperator, removeOperator } from '../operators/map';
import { Rx } from '../rx';
import { nodeToString } from './utils';

export function computed<T>(fn: () => T, label?: string) {
  const computed = new Computed(fn, undefined as T, [], label);
  computed.recompute();
  computed.dirty = false;
  return computed;
}

// function resolveRoots(deps: (Rx.Root | Rx.Computed)[], retval: Rx.Root[] = []) {
//   retval.length = 0;
//   for (const d of deps) {
//     if ('roots' in d) {
//       for (const root of d.roots) {
//         if (!retval.includes(root)) retval.push(root);
//       }
//     } else if (!retval.includes(d)) {
//       retval.push(d);
//     }
//   }
//   return retval;
// }

// function pushNode(root: Rx.Stateful, state: Rx.Stateful) {
//   let index = 1;
//   let parent: Rx.Stateful = root;
//   while (parent.next) {
//     index++;
//     parent = parent.next;
//   }
//   parent.next = state;
// }

// function removeNode(root: Rx.Stateful, state: Rx.Stateful) {
//   let index = 1;
//   let parent: Rx.Stateful = root;
//   while (parent.next) {
//     index++;
//     parent = parent.next;
//   }
//   parent.next = state;
// }

const computations: Computed[] = [];

export function register(node: Rx.Stateful) {
  if (computations.length) {
    // compute pending
    const computed = computations[computations.length - 1];
    computed.dependsOn(node);
  }
}

export class Computed<T = any> implements Rx.Stateful<T>, Rx.SignalOperator<T> {
  constructor(
    public fn: () => T,
    public snapshot: T,
    public deps: Rx.Stateful[],
    public label?: string
  ) {
    for (let i = 0; i < deps.length; i++) {
      const dep = deps[i];

      connect(dep, this);
      pushOperator(dep, this);
    }
  }

  dirty: boolean = false;
  observers?: Rx.NextObserver<T>[] | undefined;
  operators?: any[] | undefined;

  readonly type = Rx.StateOperatorType.Signal;
  target = this;

  subscribe: Rx.Subscribable<T>['subscribe'] = subscribe;

  get = () => {
    register(this);
    return this.snapshot;
  };

  toString = nodeToString;

  dependsOn(dep: Rx.Stateful) {
    const { __k } = this;
    if (!(__k in dep)) {
      this.deps.push(dep);
      connect(dep, this);
      pushOperator(dep, this);
    }

    (dep as any)[__k] = true;
  }

  __k = Symbol();

  recompute() {
    computations.push(this);
    const { deps, __k } = this;
    for (let i = 0; i < deps.length; i++) {
      const dep = deps[i] as any;
      dep[__k] = false;
    }
    const newValue = this.fn();
    for (let i = deps.length - 1; i >= 0; i--) {
      const dep = deps[i] as any;
      if (dep[__k] === false) {
        removeOperator(dep, this);
        deps.splice(i, 1);
      }
    }

    if (this !== computations.pop()) {
      throw Error('corrupt compute stack');
    }

    if (this.snapshot !== newValue) {
      this.snapshot = newValue;
      this.dirty = true;
    } else {
      this.dirty = false;
    }
  }
}
