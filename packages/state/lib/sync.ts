import { Rx } from './rx';
import { notify } from './notify';
import { Computed } from './signal';

export function sync(...stack: Rx.Stateful[]) {
  // const pending: Rx.SignalOperator[] = [];

  while (stack.length) {
    let state = stack.pop();
    while (state) {
      if (state.dirty === Rx.STALE) {
        if (state instanceof Computed) {
          state.recompute();
        }
      }

      if (state.dirty === true) {
        state.dirty = false;

        if (state.observers) notify(state);

        const { snapshot, operators } = state;

        if (operators !== undefined) {
          for (let o = operators.length - 1; o >= 0; o--) {
            const operator = operators[o];
            switch (operator.type) {
              case Rx.StateOperatorType.Map:
                const mappedValue = operator.func(snapshot);
                const { target } = operator;
                if (target.snapshot !== mappedValue) {
                  target.snapshot = mappedValue;
                  target.dirty = true;
                }
                break;
              case Rx.StateOperatorType.Bind:
                const bindValue = operator.func(snapshot);
                const bindTarget = operator.target;
                if (bindTarget.snapshot !== bindValue) {
                  bindTarget.snapshot = bindValue;
                  bindTarget.dirty = true;
                }
                break;
              case Rx.StateOperatorType.Merge:
                const { property } = operator;
                if (operator.snapshot[property] !== snapshot) {
                  operator.snapshot[property] = snapshot;
                  const { target } = operator;
                  if (!target.dirty) {
                    target.dirty = true;
                    // pending.push(target);
                    stack.push(target);
                  }
                }
                break;
              case Rx.StateOperatorType.Signal:
                if ((state as any)[operator.key] !== operator.target.version) {
                  operators.splice(o, 1);
                  (state as any)[operator.key] = undefined;
                } else {
                  operator.target.dirty = Rx.STALE;
                }
                // operators.splice(o, 1);
                // if (operator.update()) {
                //   const target = operator.target;
                //   // if (target.dirty) {
                //   console.log('push:', curr + ' => ' + target);
                //   // stack.push(target);
                //   // }
                // }
                break;
            }
          }
        }
      }
      state = (state as any).right;
    }
  }
}

// export function syncUpTo(target: Rx.Stateful) {
//   // const pending: Rx.SignalOperator[] = [];

//   let state = target.root ?? target;
//   while (state) {
//     if (state.dirty === Rx.STALE) {
//       if (state instanceof Computed) {
//         state.recompute();
//       } else if (state instanceof Effect) {
//         scheduleTask(state);
//       }
//     }

//     if (state.dirty === true) {
//       state.dirty = false;

//       // if (state.observers) notify(state);

//       const { snapshot, operators } = state as Rx.Stateful;

//       if (operators !== undefined) {
//         for (let o = operators.length - 1; o >= 0; o--) {
//           const operator = operators[o];
//           switch (operator.type) {
//             case Rx.StateOperatorType.Map:
//               const mappedValue = operator.func(snapshot);
//               const { target } = operator;
//               if (target.snapshot !== mappedValue) {
//                 target.snapshot = mappedValue;
//                 target.dirty = true;
//               }
//               break;
//             case Rx.StateOperatorType.Bind:
//               const bindValue = operator.func(snapshot);
//               const bindTarget = operator.target;
//               if (bindTarget.snapshot !== bindValue) {
//                 bindTarget.snapshot = bindValue;
//                 bindTarget.dirty = true;
//               }
//               break;
//             // case Rx.StateOperatorType.Merge:
//             //   const { property } = operator;
//             //   if (operator.snapshot[property] !== snapshot) {
//             //     operator.snapshot[property] = snapshot;
//             //     const { target } = operator;
//             //     if (!target.dirty) {
//             //       target.dirty = true;
//             //       // pending.push(target);
//             //       stack.push(target);
//             //     }
//             //   }
//             //   break;
//             case Rx.StateOperatorType.Effect:
//             case Rx.StateOperatorType.Signal:
//               if ((state as any)[operator.key] !== operator.target.version) {
//                 operators.splice(o, 1);
//                 (state as any)[operator.key] = undefined;
//               } else {
//                 operator.target.dirty = Rx.STALE;
//               }
//               // operators.splice(o, 1);
//               // if (operator.update()) {
//               //   const target = operator.target;
//               //   // if (target.dirty) {
//               //   console.log('push:', curr + ' => ' + target);
//               //   // stack.push(target);
//               //   // }
//               // }
//               break;
//           }
//         }
//       }
//     }

//     if (state === target) break;
//     state = (state as any).right;
//   }
// }
