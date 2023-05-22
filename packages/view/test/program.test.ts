import { describe, expect, it } from 'vitest';
import { Each, Sandbox, each, useState } from '../reactivity';
import { Program as Program, get } from '../lib/reactivity/program';
import { ListDiff, AppendMutation } from '../lib/reactivity/diff';

describe('program', () => {
  it('set', () => {
    const state = useState(1);

    const program = new Program();
    const objectKey = Symbol();

    const scope = {
      [objectKey]: {
        value: '',
      },
    };

    program.track(state.set(objectKey, 'value'));
    program.reconcile(scope);

    expect(scope[objectKey].value).toBe(state.initial);
  });
});

describe('each', () => {
  const objectKey = Symbol();

  const values = useState([1, 2, 3]);
  const node = each(values, (item) => {
    return {
      [objectKey]: item,
    };
  });
  const program = new Program();
  program.track(node);

  it('initialize', () => {
    const scope = {};
    program.reconcile(scope);
    const actual = get(scope, node.key) as ListDiff;

    const { mutations, scopes } = actual;
    expect(mutations.length).toBe(1);

    // initialize with same array instance
    const mut = mutations[0] as AppendMutation;

    expect(mut.items).toBe(values.initial);
    expect(scopes.length).toBe(3);
  });

  it('shift', () => {
    const scope = {};
    program.reconcile(scope);
    program.update(scope, values, [2, 3, 4, 1]);
    const actual = get(scope, node.key) as ListDiff;
    const { mutations, scopes } = actual;

    expect(mutations).toEqual([
      { type: 1, from: 1, to: 0 },
      { type: 1, from: 2, to: 1 },
      { type: 2, index: 2, item: 4 },
    ]);
  });

  it('queue', () => {
    const scope = {};
    program.reconcile(scope);
    program.update(scope, values, [4, 1, 2, 3]);
    const actual = get(scope, node.key) as ListDiff;
    const { mutations, scopes } = actual;

    expect(mutations).toEqual([{ type: 2, index: 0, item: 4 }]);
  });

  it('remove', () => {
    const scope = {};
    program.reconcile(scope);
    program.update(scope, values, [1, 3]);
    const actual = get(scope, node.key) as ListDiff;
    const { mutations } = actual;

    expect(mutations).toEqual([{ type: 3, indices: [1] }]);
  });

  it('move, remove and add', () => {
    const scope = {};
    program.reconcile(scope);
    program.update(scope, values, [4, 3, 1]);
    const actual = get(scope, node.key) as ListDiff;
    const { mutations } = actual;

    console.log(mutations);
  });
});
