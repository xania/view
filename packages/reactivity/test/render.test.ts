import { describe, expect, it } from 'vitest';
import { render } from '../lib/render';
import { useSignal } from '../lib/signal';
import { JsonAutomaton, JToken } from '../lib/json';
// import { DomDescriptorType, isDomDescriptor } from 'xania';
// import { jsx } from 'xania/jsx-runtime';

describe('render', () => {
  it('trivial sync', () => {
    // prepare view
    const view = 'sample view';

    // render view
    const root: JToken = [];
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

  it('simple signal read', () => {
    // prepare view
    const view = ['signal: ', useSignal(1)];

    // render view
    const root: any[] = [];
    render(view, new JsonAutomaton(root));

    // assert
    expect([['signal: ', 1]]).toEqual(root);
  });

  it('composed signal', async () => {
    // prepare view
    const view = ['signal: ', useSignal(Promise.resolve(1)).map((x) => x + 1)];

    // render view
    const root: JToken = [];
    await render(view, new JsonAutomaton(root));

    // assert
    expect([['signal: ', 2]]).toEqual(root);
  });

  it('render complex element', async () => {
    // prepare view
    const signal = useSignal<any>(1);

    const view = {
      messages: [1, { s: signal }, 3],
    };

    // render view
    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    sandbox.update(signal, [2, 5]);

    // assert
    expect(root).toEqual([
      {
        messages: [1, { s: [2, 5] }, 3],
      },
    ]);
  });

  it('simple signal update', async () => {
    // prepare view
    const signal = useSignal(1);
    const view = ['signal: ', signal];

    // render view
    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    expect([['signal: ', 1]]).toEqual(root);

    sandbox.update(signal, 2);

    expect([['signal: ', 2]]).toEqual(root);
  });

  it('derived signal update', async () => {
    // prepare view
    const signal = useSignal(1);
    const derived01 = signal.map((x) => x + 1);
    const derived02 = signal.map((x) => x + 2);
    const view = ['signal: ', derived01, '-', derived02];

    // render view
    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    expect(root).toEqual([['signal: ', 2, '-', 3]]);

    sandbox.update(signal, 2);

    // assert;
    expect(root).toEqual([['signal: ', 3, '-', 4]]);
  });

  it('async signal', async () => {
    const signal = useSignal(Promise.resolve(1));
    const derived = signal.map((x) => Promise.resolve(x + 1));
    const view = ['signal: ', signal, '-', derived];

    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    await sandbox.update(signal, Promise.resolve(2));

    expect(root).toEqual([['signal: ', 2, '-', 3]]);
  });
});
