// import { UnwrapStates } from '../observable/combine-latest';
import { connect } from '../graph';
import { Value } from '../observable/value';
import { pushOperator } from '../operators/map';
import { Rx } from '../rx';
import { nodeToString } from './utils';

export function computed<T>(fn: () => T, label?: string) {
  const computed = new Computed(fn, undefined as T, label);
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

// const computations: Computed[] = [];

// export function register(node: Rx.Stateful) {
//   if (computations.length) {
//     // compute pending
//     const computed = computations[computations.length - 1];
//     computed.dependsOn(node);
//   }
// }

export class Computed<T = any>
  extends Value<T>
  implements Rx.SignalOperator<T>
{
  constructor(public fn: () => T, snapshot: T, public label?: string) {
    super(snapshot);
  }

  root?: Rx.Stateful<T>['root'];
  version = 1;

  readonly type = Rx.StateOperatorType.Signal;
  target = this;

  read() {
    dependsOn(this);
    return this.snapshot as T;
  }
  get = this.read;

  toString = nodeToString;

  dependsOn(dep: Rx.Stateful) {
    const { key } = this;

    if (!(dep as any)[key]) {
      connect(dep, this);
      pushOperator(dep, this);
    }
    (dep as any)[key] = this.version;
  }

  key = Symbol();
  recompute = recompute;
}

interface ComputeContext<T = any> {
  readonly key: symbol;
  readonly fn: () => T;
  readonly target: Rx.Stateful;
  snapshot?: T;
  dirty: Rx.Stateful['dirty'];
  version: number;
  dependsOn(state: Rx.Stateful): void;
}
let computeContext: ComputeContext | undefined;
const context: ComputeContext[] = [];
export function recompute(this: ComputeContext) {
  if (computeContext) {
    context.push(computeContext);
  }
  computeContext = this;
  this.version++;
  const newValue = this.fn();
  computeContext = context.pop();

  if (this.snapshot !== newValue) {
    this.snapshot = newValue;
    this.dirty = true;
  } else {
    this.dirty = false;
  }
}
export function dependsOn(state: Rx.Stateful) {
  if (computeContext) {
    computeContext.dependsOn(state);
  }
}
