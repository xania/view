import { describe, expect, it } from 'vitest';
import { render } from '../lib/render';
import { useState } from '../lib/state';
import {
  type AutomatonObject,
  defaultEventFactory,
  events as objectEvents,
  type EventFactory,
  JsonAutomaton,
  domObjectFactory,
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

  it('uses the dom object factory for typed objects', () => {
    const view = {
      [objectType]: 'section',
      id: 'hero',
      children: ['body'],
    };

    const root: any[] = [];
    render(view, new JsonAutomaton(root, undefined, domObjectFactory));

    expect(root).toEqual([
      {
        type: 'section',
        id: 'hero',
        children: ['body'],
      },
    ]);
  });

  it('uses the dom object factory for nested typed objects', () => {
    const view = {
      [objectType]: 'section',
      children: [
        {
          [objectType]: 'span',
          children: ['label'],
        },
      ],
    };

    const root: any[] = [];
    render(view, new JsonAutomaton(root, undefined, domObjectFactory));

    expect(root).toEqual([
      {
        type: 'section',
        children: [
          {
            type: 'span',
            children: ['label'],
          },
        ],
      },
    ]);
  });

  it('preserves special object events through the dom object factory', () => {
    const click = () => undefined;
    const view = {
      [objectType]: 'button',
      [objectEvents]: { click },
      children: ['Run'],
    };

    const root: any[] = [];
    render(view, new JsonAutomaton(root, undefined, domObjectFactory));

    expect(root[0].type).toBe('button');
    expect(root[0][objectEvents]).toEqual({ click });
  });

  it('uses a custom event factory for special object events', () => {
    const click = () => undefined;
    const captured: Array<{
      target: AutomatonObject;
      eventName: string;
      handler: Function;
    }> = [];

    const eventFactory: EventFactory = (target, eventName, handler) => {
      captured.push({ target, eventName, handler });
      defaultEventFactory(target, eventName, handler);
    };

    const root: any[] = [];
    render(
      {
        [objectType]: 'button',
        [objectEvents]: { click },
        children: ['Run'],
      },
      new JsonAutomaton(root, undefined, domObjectFactory, eventFactory)
    );

    expect(captured).toHaveLength(1);
    expect(captured[0].target).toBe(root[0]);
    expect(captured[0].eventName).toBe('click');
    expect(captured[0].handler).toBe(click);
    expect(root[0][objectEvents]).toEqual({ click });
  });
});
