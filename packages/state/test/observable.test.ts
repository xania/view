import { expect, describe, it } from 'vitest';
import { combineLatest } from '../lib/utils/combine-latest';
import { State } from '../lib/observable/state';

describe('observable', () => {
  it('create', () => {
    const state = new State(10);
    expect(state.get()).toBe(10);
  });

  it('map operator', () => {
    const x = new State(2);
    const y = x.map((x) => x * 3);
    expect(y.get()).toBe(6);
  });
  it('bind operator', () => {
    const x = new State(1);
    const y = x.bind((a) => Promise.resolve(a * 2));
    expect(y.dirty).not.toBe(false);

    return new Promise<void>((resolve) => {
      y.effect((value) => {
        expect(value).toBe(4);
        resolve();
      });

      x.set(2);
    });
  });

  it('combine latest', () => {
    const x = new State(2);
    const y = new State(3);
    const z = combineLatest([x, y]).map(([x, y]) => x * y);
    expect(z.get()).toBe(6);
  });
});
