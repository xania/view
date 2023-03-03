import { notify } from './notify';
import { Computed } from './signal';
import { Rx } from './rx';

export function sync(stack: Rx.Stateful[]) {
  // const pending: Rx.SignalOperator[] = [];

  while (stack.length) {
    let curr: Rx.Stateful = stack.pop()!;
    if (curr.dirty && (!(curr instanceof Computed) || curr.update())) {
      curr.dirty = false;
      if (curr.observers) notify(curr);

      const { snapshot, operators } = curr;

      if (operators !== undefined) {
        for (let o = 0, olen = operators.length; o < olen; o++) {
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
              operator.target.dirty = true;
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

      // for (let i = 0, len = pending.length; i < len; i++) {
      //   const operator = pending[i];
      //   operator.update();
      //   const target = operator.target;
      //   if (target.mode === Rx.Mode.dirty) {
      //     console.log('push:', curr + ' => ' + target);
      //     stack.push(target);
      //   }
      // }
      // pending.length = 0;
    }
    if (curr.right) {
      stack.push(curr.right);
    }
  }
}
