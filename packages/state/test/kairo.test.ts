import { avoidablePropagation } from './kairo/avoidable';
import { broadPropagation } from './kairo/broad';
import { deepPropagation } from './kairo/deep';
import { diamond } from './kairo/diamond';
import { mux } from './kairo/mux';
import { repeatedObservers } from './kairo/repeated';
import { triangle } from './kairo/triangle';
import { unstable } from './kairo/unstable';

import { describe, expect, it } from 'vitest';
import { ReactiveFramework } from './util/reactiveFramework';
import { batch, computed, effect, Signal } from '../index';
import { fastestTest } from './util/benchRepeat';
import { logPerfResult } from './util/perfLogging';

const cases = {
  avoidablePropagation,
  broadPropagation,
  deepPropagation,
  diamond,
  mux,
  repeatedObservers,
  triangle,
  unstable,
};

const framework: ReactiveFramework = {
  name: '@xania/state',
  signal<T>(value: T, label?: string) {
    const signal = new Signal(value, label);
    return {
      read: signal.get,
      write(value) {
        signal.set(value as any);
      },
    };
  },
  computed(fn: () => any, label?: string) {
    const m = computed(fn, label);
    return {
      read: m.get,
    };
  },
  run: () => {},
  effect: effect,
  withBatch: batch,
  withBuild: (fn) => fn(),
  assert(x, y) {
    expect(x).toBe(y);
  },
};

describe('kairo bench', () => {
  it('avoidablePropagation', async () => {
    await runCase(cases.avoidablePropagation);
  }, 100000);
  // it('broadPropagation', () => {
  //   return runCase(cases.broadPropagation);
  // }, 10000);
  // it('deepPropagation', () => {
  //   return runCase(cases.deepPropagation);
  // }, 10000);
  // it('diamond', () => {
  //   return runCase(cases.diamond);
  // }, 10000);
  // it('mux', () => {
  //   return runCase(cases.mux);
  // }, 10000);

  async function runCase(c: typeof cases['avoidablePropagation']) {
    const iter = framework.withBuild(() => {
      const iter = c(framework);
      return iter;
    });

    // v8.optimizeFunctionOnNextCall(iter);
    iter();

    const { timing } = await fastestTest(10, () => {
      for (let i = 0; i < 1000; i++) {
        iter();
      }
    });

    logPerfResult({
      framework: framework.name,
      test: c.name,
      time: timing.time.toFixed(2),
      gcTime: timing.gcTime?.toFixed(2),
    });
  }
});
