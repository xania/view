import { describe, expect, it } from 'vitest';
import {
  createReconcile,
  reconcile,
  type ReconcileOperation,
} from '../lib/core/reconcile';

describe('reconcile', () => {
  it('creates insert operations for an initial list', () => {
    expect(reconcile([1, 2])).toEqual([
      { type: 'insert', index: 0, value: 1 },
      { type: 'insert', index: 1, value: 2 },
    ]);
  });

  it('transforms primitive arrays with indexed operations', () => {
    const prev = [1, 2, 3, 4];
    const next = [2, 5, 4, 1];
    const target = prev.slice();

    applyOperations(target, reconcile(next, prev));

    expect(target).toEqual(next);
  });

  it('transforms keyed object arrays', () => {
    const a = { id: 1, value: 'a' };
    const b = { id: 2, value: 'b' };
    const c = { id: 3, value: 'c' };
    const nextB = { id: 2, value: 'B' };
    const next = [nextB, c, { id: 4, value: 'd' }, a];
    const target = [a, b, c];

    applyOperations(
      target,
      reconcile(next, target, {
        key: (item) => item.id,
      })
    );

    expect(target).toEqual(next);
  });

  it('does not move preserved suffix values into the middle', () => {
    const prev = ['a', 'b'];
    const next = ['b', 'a', 'b'];
    const target = prev.slice();

    applyOperations(target, reconcile(next, prev));

    expect(target).toEqual(next);
  });

  it('remembers previous values with createReconcile', () => {
    const diff = createReconcile<number>();
    const target: number[] = [];

    applyOperations(target, diff([1, 2]));
    applyOperations(target, diff([2, 3, 1]));

    expect(target).toEqual([2, 3, 1]);
  });
});

function applyOperations<T>(target: T[], operations: ReconcileOperation<T>[]) {
  for (const operation of operations) {
    switch (operation.type) {
      case 'insert':
        target.splice(operation.index, 0, operation.value);
        break;
      case 'remove':
        target.splice(operation.index, 1);
        break;
      case 'move': {
        const [value] = target.splice(operation.from, 1);
        target.splice(operation.to, 0, value);
        break;
      }
      case 'update':
        target[operation.index] = operation.value;
        break;
    }
  }
}
