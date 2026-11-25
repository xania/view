import { describe, expect, it } from 'vitest';
import { render } from '../lib/render';
import { useState } from '../lib/state';
import { JsonAutomaton } from '../lib/json-automaton';
import { If } from '../lib/core/if';

describe('render if', () => {
  it('true branch sync', () => {
    // prepare view
    const view = If(useState(true), 'conditional view');

    // render view
    const root: any[] = [];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual(['conditional view']);
  });

  it('false branch sync', () => {
    // prepare view
    const view = If(useState(false), 'conditional view');

    // render view
    const root: any[] = [];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual([]);
  });

  it('applies hidden conditional updates when the region is shown', async () => {
    const state = useState(1);
    const visible = useState(false);
    const view = If(visible, state);

    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    expect(root).toStrictEqual([]);

    await sandbox.update(state, 2);
    expect(root).toStrictEqual([]);

    await sandbox.update(visible, true);
    expect(root).toStrictEqual([2]);
  });
});
