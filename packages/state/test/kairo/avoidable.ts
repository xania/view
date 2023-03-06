import { ReactiveFramework } from '../util/reactiveFramework';
import { busy } from './util';

/** avoidable change propagation  */
export function avoidablePropagation(bridge: ReactiveFramework) {
  let head = bridge.signal(0, 'head');
  let computed1 = bridge.computed(() => head.read(), 'c1');
  let computed2 = bridge.computed(() => (computed1.read(), 0), 'c2');
  let computed3 = bridge.computed(() => (busy(), computed2.read() + 1), 'c3'); // heavy computation
  let computed4 = bridge.computed(() => computed3.read() + 2, 'c4');
  let computed5 = bridge.computed(() => computed4.read() + 3, 'c5');
  // computed5.effect(busy);

  return () => {
    bridge.withBatch(() => {
      head.write(1);
      // bridge.assert(computed5.read(), 6);
    });
    for (let i = 0; i < 1000; i++) {
      bridge.withBatch(() => {
        head.write(i);
        // bridge.assert(computed5.read(), 6);
      });
    }
  };
}
