import { describe, expect, it } from 'vitest';
import { render } from '../lib/render';
import { useState } from '../lib/state';
import { JsonAutomaton } from '../lib/json';
import { If } from '../lib/core/if';

describe('render if', () => {
  it('true branch sync', () => {
    // prepare view
    const view = If(useState(true), 'conditional view');

    // render view
    const root: any[] = [];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual([view.body]);
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

  it('reactive branch sync', async () => {
    // prepare view
    var state = useState(false);
    const view = ['left', If(state, 'conditional view'), 'right'];

    // render view
    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    // assert
    await sandbox.update(state, true);
    expect(root).toStrictEqual([['left', 'conditional view', 'right']]);

    // assert
    sandbox.update(state, false);
    expect(root).toStrictEqual([['left', 'right']]);
  });

  it('reactive branch of branch', async () => {
    // prepare view
    const state = useState(1);
    const visisble = useState(false);
    const view = If(visisble, state);

    // render view
    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual([]);

    // show node
    await sandbox.update(visisble, true);
    expect(root).toStrictEqual([1]);

    // update node value
    await sandbox.update(state, 2);
    expect(root).toStrictEqual([2]);
  });
});
