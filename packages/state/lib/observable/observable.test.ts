import { expect, describe, it } from 'vitest';
import { combineLatest } from './combine-latest';
import { State } from './state';

describe('signal', () => {
  it('create', () => {
    const state = new State(10);
    expect(state.get()).toBe(10);
  });

  it('map operator', () => {
    const x = new State(2);
    const y = x.map((x) => x * 3);
    expect(y.get()).toBe(6);
  });

  it('combine latest', () => {
    const x = new State(2);
    const y = new State(3);
    const z = combineLatest([x, y]).map(([x, y]) => x * y);
    expect(z.get()).toBe(6);
  });
});
