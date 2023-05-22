import { describe, expect, it, vi } from 'vitest';
import { Append, Program, Sandbox, diff, useState } from '../reactivity';
import { MutationOperator } from '../lib/render/browser/mutation-operator';
import { ready } from '../lib';

describe('list reactivity', () => {
  it('append', () => {
    const target = new List(1, 2);
    const numbers = useState([3, 4]);
    const sandbox = new Program();
    sandbox.track(new Append(numbers, target));
    const scope = {};
    sandbox.reconcile(scope);

    expect([...target.set]).toEqual([1, 2, 3, 4]);

    sandbox.update(scope, numbers, [5, 6, 7]);

    expect([...target.set]).toEqual([1, 2, 5, 6, 7]);
  });

  it('list mutations', () => {
    const state = useState<number[]>([]);
    const mutations = state.pipe(diff);

    const target: number[] = [];

    const sandbox = new Program();
    sandbox.track(
      mutations.effect((mutations) => {
        for (const m of mutations) {
          switch (m.type) {
            case 'reset':
              target.length = 0;
              target.push(...m.items);
              break;
            case 'add':
              if ('func' in m) {
                target.push(m.func(target));
              } else {
                target.push(m.value);
              }
              break;
            default:
              throw Error('unsupported mutation: ' + m.type);
          }
        }
      })
    );
    const scope = {};
    sandbox.reconcile(scope);
    sandbox.update(scope, state, [1, 2]);
    sandbox.update(scope, state, [3, 4]);
    sandbox.update(scope, mutations, [{ type: 'add', value: 5 }]);

    expect(target).toEqual([3, 4, 5]);
  });

  it('list mutations 2', async () => {
    const account = useState(Promise.resolve('account'));
    const state = account.map((acc) => Promise.resolve([acc]));
    const mutations = state.pipe(diff);

    const target: string[] = [];

    const sandbox = new Program();
    sandbox.track(
      mutations.effect((mutations) => {
        for (const m of mutations) {
          switch (m.type) {
            case 'reset':
              target.length = 0;
              target.push(...m.items);
              break;
            case 'add':
              if ('func' in m) {
                target.push(m.func(target));
              } else {
                target.push(m.value);
              }
              break;
            default:
              throw Error('unsupported mutation: ' + m.type);
          }
        }
      })
    );
    await ready(sandbox.reconcile({}));
    expect(target).toEqual(['account']);
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
