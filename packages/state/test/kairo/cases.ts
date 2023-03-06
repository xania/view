import { avoidablePropagation } from './avoidable';
import { broadPropagation } from './broad';
import { deepPropagation } from './deep';
import { diamond } from './diamond';
import { mux } from './mux';
import { repeatedObservers } from './repeated';
import { triangle } from './triangle';
import { unstable } from './unstable';

import { ReactiveFramework } from '../util/reactiveFramework';
// import { batch, computed, effect, Signal } from '../../index';
import { computed, signal, Signal } from '../../lib/signal';
import { batch } from '../../lib/batch';
import { expect } from 'vitest';

export const cases = {
  avoidablePropagation,
  broadPropagation,
  deepPropagation,
  diamond,
  mux,
  repeatedObservers,
  triangle,
  unstable,
};

export async function runCase(c: typeof cases['avoidablePropagation']) {
  const iter = framework.withBuild(() => {
    const iter = c(framework);
    return iter;
  });

  // v8.optimizeFunctionOnNextCall(iter);
  iter();

  for (let i = 0; i < 10000; i++) {
    iter();
  }
}

const framework: ReactiveFramework = {
  name: '@xania/state',
  signal: signal,
  computed: computed,
  run: () => {},
  effect() {},
  withBatch: batch,
  withBuild: (fn) => fn(),
  assert(x, y) {
    expect(x).toBe(y);
  },
};
