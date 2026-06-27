import { describe, expect, it } from 'vitest';
import { render } from '../lib/render';
import { useState } from '../lib/state';
import {
  JsonAutomaton,
  type as objectType,
} from '../lib/json-automaton';

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

  it('simple state read', () => {
    // prepare view
    const view = ['state: ', useState(1)];

    // render view
    const root: any[] = [];
    render(view, new JsonAutomaton(root));

    // assert
    expect([['state: ', 1]]).toEqual(root);
  });

  it('complex state read', async () => {
    // prepare view
    const x = useState(1);
    const view = [
      'state: ',
      x,
      { a: Promise.resolve(x), p: { c: Promise.resolve(x) } },
    ];

    // render view
    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    sandbox.update(x, 2);

    // assert
    expect([['state: ', 2, { a: 2, p: { c: 2 } }]]).toEqual(root);
  });

  it('simple derived state read', async () => {
    // prepare view
    const x = useState(1);
    const view = ['derived state: ', x.map((x) => x + 1)];

    // render view
    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    sandbox.update(x, 2);

    // assert
    expect([['derived state: ', 3]]).toEqual(root);
  });

  it('multiple derived state read', async () => {
    const count = useState(2);
    const view = [
      count.map((value) => Promise.resolve(value * 2)),
      count.map((value) => `count:${value}`),
    ];

    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    expect(root).toMatchObject([[4, 'count:2']]);

    await sandbox.update(count, 3);

    expect(root).toMatchObject([[6, 'count:3']]);
  });

  it('uses the default object factory for typed objects', () => {
    const view = {
      [objectType]: 'section',
      value: 1,
    };

    const root: any[] = [];
    render(view, new JsonAutomaton(root));

    expect(root).toEqual([
      {
        [objectType]: 'section',
        value: 1,
      },
    ]);
  });

  it('uses a custom object factory for typed objects', () => {
    const view = {
      [objectType]: 'section',
      value: 1,
    };
    const created: Array<string | undefined> = [];

    const root: any[] = [];
    render(
      view,
      new JsonAutomaton(root, undefined, (type) => {
        created.push(type);
        return type ? { kind: type } : {};
      })
    );

    expect(created).toEqual(['section']);
    expect(root).toEqual([
      {
        kind: 'section',
        value: 1,
      },
    ]);
  });
});
