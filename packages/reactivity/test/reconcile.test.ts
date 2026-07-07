import { describe, expect, it } from 'vitest';
import { reconcile, type ReconcileOperation } from '../lib/core/reconcile';

describe('reconcile', () => {
  it('creates insert operations for each item in an initial list', () => {
    expect(Array.from(reconcile([1, 2], createTemplate()))).toEqual([
      { type: 'insert', index: 0, value: 1 },
      { type: 'insert', index: 1, value: 2 },
    ]);
  });

  it('transforms primitive arrays with indexed operations', () => {
    const prev = [1, 2, 3, 4];
    const next = [2, 5, 4, 1];
    const target = prev.slice();
    const template = createTemplate(prev);

    applyOperations(target, reconcile(next, template), template);

    expect(target).toEqual(next);
    expect(template.regions.map((region) => region.key)).toEqual(next);
  });

  it('transforms object arrays by identity', () => {
    const a = { id: 1, value: 'a' };
    const b = { id: 2, value: 'b' };
    const c = { id: 3, value: 'c' };
    const d = { id: 4, value: 'd' };
    const next = [b, c, d, a];
    const target = [a, b, c];
    const template = createTemplate(target);

    applyOperations(target, reconcile(next, template), template);

    expect(target).toEqual(next);
    expect(template.regions.map((region) => region.key)).toEqual(next);
  });

  it('does not move preserved suffix values into the middle', () => {
    const prev = ['a', 'b'];
    const next = ['b', 'a', 'b'];
    const target = prev.slice();
    const template = createTemplate(prev);

    applyOperations(target, reconcile(next, template), template);

    expect(target).toEqual(next);
    expect(template.regions.map((region) => region.key)).toEqual(next);
  });

  it('returns one operation at a time', () => {
    const template = createTemplate<number>();
    const operations = reconcile([1, 2], template);

    expect(operations.next().value).toEqual({
      type: 'insert',
      index: 0,
      value: 1,
    });
    template.regions.splice(0, 0, { key: 1 });
    expect(template.regions.map((region) => region.key)).toEqual([1]);

    expect(operations.next().value).toEqual({
      type: 'insert',
      index: 1,
      value: 2,
    });
    template.regions.splice(1, 0, { key: 2 });
    expect(template.regions.map((region) => region.key)).toEqual([1, 2]);
    expect(operations.next()).toEqual({ value: undefined, done: true });
  });

  it('continues reconciling from its internal state', () => {
    const template = createTemplate([1, 2, 3]);
    const target = [1, 2, 3];
    const next = [3, 1, 4];
    const operations = reconcile(next, template);

    applyOperations(target, operations, template);

    expect(target).toEqual(next);
    expect(template.regions.map((region) => region.key)).toEqual(next);
  });
});

function createTemplate<T>(values: T[] = []) {
  return {
    regions: values.map((key) => ({ key })),
  };
}

function applyOperations<T>(
  target: T[],
  operations: Generator<ReconcileOperation<T>, void>,
  template: ReturnType<typeof createTemplate<T>>
) {
  for (const operation of operations) {
    applyOperation(target, operation, template);
  }
}

function applyOperation<T>(
  target: T[],
  operation: ReconcileOperation<T>,
  template: ReturnType<typeof createTemplate<T>>
) {
  switch (operation.type) {
    case 'insert':
      target.splice(operation.index, 0, operation.value);
      template.regions.splice(operation.index, 0, { key: operation.value });
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
