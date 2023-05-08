import { describe, expect, it, vi } from 'vitest';
import { Append, Sandbox, diff, useState } from '../reactivity';
import { MutationOperator } from '../lib/render/browser/mutation-operator';

describe('list reactivity', () => {
  it('append', () => {
    const target = new List(1, 2);
    const numbers = useState([3, 4]);
    const sandbox = new Sandbox();
    sandbox.track(new Append(numbers, target));

    expect([...target.set]).toEqual([1, 2, 3, 4]);

    sandbox.update(numbers, [5, 6, 7]);

    expect([...target.set]).toEqual([1, 2, 5, 6, 7]);
  });

  it('list mutations', () => {
    const state = useState<number[]>([]);
    const mutations = state.pipe(diff);

    const target: number[] = [];

    const sandbox = new Sandbox();
    sandbox.track(
      mutations.effect((mutations) => {
        for (const m of mutations) {
          switch (m.type) {
            case 'reset':
              target.length = 0;
              target.push(...m.items);
              break;
            case 'add':
              if (m.itemOrGetter instanceof Function) {
                target.push(m.itemOrGetter(target));
              } else {
                target.push(m.itemOrGetter);
              }
              break;
            default:
              throw Error('unsupported mutation: ' + m.type);
          }
        }
      })
    );
    sandbox.update(state, [1, 2]);
    sandbox.update(state, [3, 4]);
    sandbox.update(mutations, [{ type: 'add', itemOrGetter: 5 }]);

    expect(target).toEqual([3, 4, 5]);
  });
});

class List<T> {
  public set: Set<T>;
  constructor(...values: T[]) {
    this.set = new Set(values);
  }

  add(...values: T[]) {
    for (const x of values) {
      this.set.add(x);
    }
  }
  remove(...values: T[]) {
    for (const x of values) {
      this.set.delete(x);
    }
  }
}
