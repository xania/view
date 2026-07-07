import { describe, expect, it } from 'vitest';
import { reconcile, type ReconcileOperation } from '../lib/core/reconcile';
import { children, JsonAutomaton, render } from '../lib';

describe('reconcile', () => {
  it('creates insert operations for an initial list', () => {
    const view = {
      type: 'object as container',
      [children]: [1, 2],
    };

    const root = {};
    render(view, new JsonAutomaton(root));

    expect(root).toEqual(view);
  });
});
