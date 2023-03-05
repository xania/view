﻿import { expect, describe, it } from 'vitest';
import { batch } from '../lib/scheduler';
import { computed } from '../lib/signal/computed';
import { effect } from '../lib/signal/effect';
import { signal, Signal } from '../lib/signal/signal';
// import { batch, effect, computed, signal, Signal } from '../lib';

describe('signal', () => {
  it('create', () => {
    const signal = new Signal(0);
    expect(signal.get()).toBe(0);
  });

  it('compute 0', () => {
    const y = computed(() => 2);
    expect(y.get()).toBe(2);
  });

  it('compute 1', () => {
    const x = new Signal(1);
    const y = computed(() => x.get() * 2);
    expect(y.get()).toBe(x.get() * 2);
  });

  it('compute more', () => {
    const x = new Signal(2);
    const y = new Signal(3);
    const z = computed(() => x.get() * y.get());
    expect(z.get()).toBe(6);
  });

  it('effect', () => {
    const x = new Signal(2, 'x');
    const y = new Signal(3, 'y');

    const f = new Signal(0, 'f');

    const eff01 = effect(
      count(
        () => {
          f.set(x.get() * y.get());
        },
        (x) => expect(x).toBeLessThan(4)
      ),
      'eff01'
    );

    // expect(eff01.deps.length).toBe(2);

    x.set(11);
    expect(f.get()).toBe(33);
    y.set(12);
    expect(f.get()).toBe(132);
  });

  it('batch effects', () => {
    const x = new Signal(2, 'x');
    const y = new Signal(3, 'y');

    const f = new Signal(0, 'f');

    const eff01 = effect(
      count(
        () => {
          f.set(x.get() * y.get());
        },
        (x) => expect(x).toBeLessThan(4)
      ),
      'eff01'
    );
    // expect(eff01.deps.length).toBe(2);

    batch(() => {
      x.set(11);
      expect(f.get()).toBe(6);
      y.set(12);
      expect(f.get()).toBe(6);
    });

    expect(f.get()).toBe(132);
  });

  it('conditional signals', () => {
    const even = signal(false, 'even');

    const x = signal(1, 'x');
    const y = signal(2, 'y');

    const result = computed(() => (even.get() ? x.get() : y.get()), 'result');
    // expect(result.roots.length).toBe(2);

    expect(result.get()).toBe(y.get());
    expect(x.operators).not.toBeDefined();
    expect((y as any)[result.key]).toBe(result.version);
    expect((x as any)[result.key]).toBeUndefined();

    even.set(true);
    expect(result.get()).toBe(x.get());

    expect((x as any)[result.key]).toBe(result.version);
    expect((y as any)[result.key]).toBeLessThan(result.version);
  });
});

function count(fn: Function, cb: (n: number) => void) {
  let count = 0;
  return function () {
    fn();
    cb(++count);
  };
}
