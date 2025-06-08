import { describe, expect, it } from 'vitest';
import { render } from '../lib/render';
import { useState } from '../lib/state';
import { JsonAutomaton, JToken } from '../lib/json';
// import { DomDescriptorType, isDomDescriptor } from 'xania';
// import { jsx } from 'xania/jsx-runtime';

describe('render state', () => {
  it('trivial sync', () => {
    // prepare view
    const view = 'sample view';

    // render view
    const root: any[] = [];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual([view]);
  });

  it('trivial async', async () => {
    // prepare view
    const view = Promise.resolve('sample view');

    // render view
    const root: JToken = [];
    await render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual(['sample view']);
  });

  it('simple state read', () => {
    // prepare view
    const view = ['state: ', useState(1)];

    // render view
    const root: any[] = [];
    render(view, new JsonAutomaton(root));

    // assert
    expect([['state: ', 1]]).toEqual(root);
  });

  it('composed state', async () => {
    // prepare view
    const view = ['state: ', useState(Promise.resolve(1)).map((x) => x + 1)];

    // render view
    const root: JToken = [];
    await render(view, new JsonAutomaton(root));

    // assert
    expect([['state: ', 2]]).toEqual(root);
  });

  it('render complex element', async () => {
    // prepare view
    const state = useState<any>(1);

    const view = {
      messages: [1, { s: state }, 3],
    };

    // render view
    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    sandbox.update(state, [2, 5]);

    // assert
    expect(root).toEqual([
      {
        messages: [1, { s: [2, 5] }, 3],
      },
    ]);
  });

  it('simple state update', async () => {
    // prepare view
    const state = useState(1);
    const view = ['state: ', state];

    // render view
    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    expect([['state: ', 1]]).toEqual(root);

    sandbox.update(state, 2);

    expect([['state: ', 2]]).toEqual(root);
  });

  it('derived state update', async () => {
    // prepare view
    const state = useState(1);
    const derived01 = state.map((x) => x + 1);
    const derived02 = state.map((x) => x + 2);
    const view = ['state: ', derived01, '-', derived02];

    // render view
    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    expect(root).toEqual([['state: ', 2, '-', 3]]);

    sandbox.update(state, 2);

    // assert;
    expect(root).toEqual([['state: ', 3, '-', 4]]);
  });

  it('async state', async () => {
    const state = useState(Promise.resolve(1));
    const derived = state.map((x) => Promise.resolve(x + 1));
    const view = ['state: ', state, '-', derived];

    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    await sandbox.update(state, Promise.resolve(2));

    expect(root).toEqual([['state: ', 2, '-', 3]]);
  });
});

function readableAmount(amount: number) {
  return `${(amount / 1000).toFixed(0)}K`;
}
