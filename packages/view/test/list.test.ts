import { describe, expect, it, vi } from 'vitest';
import { Append, Sandbox, useState } from '../reactivity';

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
