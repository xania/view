import { describe, expect, it } from 'vitest';
import { If } from '../lib/core/if';
import { ForEach } from '../lib/core/for';
import { JsonAutomaton } from '../lib/json';
import { render } from '../lib/render';
import { useState } from '../lib/state';

describe('render async', () => {
  it('renders a promised view', async () => {
    const view = Promise.resolve('sample view');

    const root: any[] = [];
    await render(view, new JsonAutomaton(root));

    expect(root).toStrictEqual(['sample view']);
  });

  it('renders a composed promised state', async () => {
    const view = ['state: ', useState(Promise.resolve(1)).map((x) => x + 1)];

    const root: any[] = [];
    await render(view, new JsonAutomaton(root));

    expect([['state: ', 2]]).toEqual(root);
  });

  it('updates a complex element state', async () => {
    const state = useState<any>(2);

    const view = {
      messages: [1, { s: state }, 3],
    };

    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    expect(root).toEqual([
      {
        messages: [1, { s: 2 }, 3],
      },
    ]);

    sandbox.update(state, 4);

    expect(root).toEqual([
      {
        messages: [1, { s: 4 }, 3],
      },
    ]);
  });

  it('updates a simple state', async () => {
    const state = useState(1);
    const view = ['state: ', state];

    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    expect([['state: ', 1]]).toEqual(root);

    sandbox.update(state, 2);

    expect([['state: ', 2]]).toEqual(root);
  });

  it('renders async state', async () => {
    const state = useState(Promise.resolve(1));
    const derived = state.map((x) => Promise.resolve(x + 1));
    const view = ['state: ', state, '-', derived];

    const root: any[] = [];
    await render(view, new JsonAutomaton(root));

    expect(root).toEqual([['state: ', 1, '-', 2]]);
  });

  it('updates a reactive conditional branch', async () => {
    var state = useState(false);
    const view = ['left', If(state, 'conditional view'), 'right'];

    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    await sandbox.update(state, true);
    expect(root).toStrictEqual([['left', 'conditional view', 'right']]);

    sandbox.update(state, false);
    expect(root).toStrictEqual([['left', 'right']]);
  });

  it('updates a state inside a reactive conditional branch', async () => {
    const state = useState(1);
    const visible = useState(false);
    const view = If(visible, state);

    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    expect(root).toStrictEqual([]);

    await sandbox.update(visible, true);
    expect(root).toStrictEqual([1]);

    await sandbox.update(state, 2);
    expect(root).toStrictEqual([2]);
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

  it('updates foreach state items', async () => {
    const s = useState(3);
    var values = useState([1, 2, 3]);
    const view = ForEach(values, s);

    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));
    await sandbox.update(s, 4);

    expect(root).toStrictEqual([4, 4, 4]);
  });

  it('updates foreach complex state items', async () => {
    const s = useState(3);
    var values = useState([1, 2]);
    const view = ForEach(values, { s });

    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));
    await sandbox.update(s, 4);

    expect(root).toStrictEqual([{ s: 4 }, { s: 4 }]);
  });

  it('deletes foreach component values during reconcile', async () => {
    const s = useState(3);
    const values = useState([1, 2, 3]);
    const view = ForEach(values, { s });

    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    expect(root).toStrictEqual([{ s: 3 }, { s: 3 }, { s: 3 }]);

    await sandbox.update(values, [2, 3]);

    expect(root).toStrictEqual([{ s: 3 }, { s: 3 }]);
  });

  it('renders foreach complex item state with async values', async () => {
    var values = useState([1, 2, 3]);
    var p = useState(Promise.resolve('123'));
    const view = Promise.resolve(
      ForEach(values, (e) => ({
        s: Promise.resolve(e),
        p,
      }))
    );

    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    expect(root).toStrictEqual([
      { s: 1, p: '123' },
      { s: 2, p: '123' },
      { s: 3, p: '123' },
    ]);

    await sandbox.update(p, Promise.resolve('456'));

    expect(root).toStrictEqual([
      { s: 1, p: '456' },
      { s: 2, p: '456' },
      { s: 3, p: '456' },
    ]);
  });
});
