// import { UnwrapStates } from '../observable/combine-latest';
import { connect } from '../graph';
import { subscribe } from '../observable/subscribe';
import { pushOperator, removeOperator } from '../operators/map';
import { Rx } from '../rx';
import { nodeToString } from './utils';

export function computed<T>(fn: () => T, label?: string) {
  const deps: Rx.Stateful[] = [];
  const value = track(fn, deps);
  // const roots = resolveRoots(deps);
  return new Computed(fn, value, deps, label);
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

const computations: Rx.Stateful[][] = [];

function track<T>(fn: () => T, deps: Rx.Stateful[] = []) {
  computations.push(deps);
  const value = fn();
  if (deps !== computations.pop()) {
    throw Error('corrupt compute stack');
  }

  return value;
}

export function register(node: Rx.Stateful) {
  if (computations.length) {
    // compute pending
    const computation = computations[computations.length - 1];
    if (!computation.includes(node)) {
      computation.push(node);
    }
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
  right: Rx.Stateful['right'];

  subscribe = subscribe;

  get = () => {
    register(this);
    return this.snapshot;
  };

  toString = nodeToString;

  update() {
    const { deps, fn } = this;
    for (let i = 0, len = deps.length; i < len; i++) {
      const dep = deps[i];
      removeOperator(dep, this);
      // removeNode(dep, computed);
    }

    deps.length = 0;
    const newValue = track(fn, deps);
    for (let i = 0; i < deps.length; i++) {
      const dep = deps[i];
      connect(dep, this);
      pushOperator(dep, this);
      // pushNode(dep, computed);
    }

    if (newValue !== this.snapshot) {
      this.snapshot = newValue;
      return true;
    } else if (this.dirty) {
      // debugger;
    }
    return false;
  }
}
