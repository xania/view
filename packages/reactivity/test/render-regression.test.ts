import { describe, expect, it } from 'vitest';
import { ForEach } from '../lib/core/for';
import { If } from '../lib/core/if';
import { JsonAutomaton } from '../lib/json-automaton';
import { render } from '../lib/render';
import { useState } from '../lib/state';

describe('render regression', () => {
  it('renders a derived sync state', () => {
    // prepare view
    const view = ['state: ', useState(2).map((x) => x * 3)];

    // render view
    const root: any[] = [];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toEqual([['state: ', 6]]);
  });

  it('renders nested sync objects and arrays', () => {
    // prepare view
    const view = {
      label: 'state',
      values: [useState(1), 2, { total: useState(3) }],
    };

    // render view
    const root: any[] = [];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toEqual([
      {
        label: 'state',
        values: [1, 2, { total: 3 }],
      },
    ]);
  });

  it('renders a complex true branch sync', () => {
    // prepare view
    const view = If(useState(true), {
      status: ['ready', useState(1)],
    });

    // render view
    const root: any[] = [];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual([
      {
        status: ['ready', 1],
      },
    ]);
  });

  it('foreach complex item state sync', () => {
    // prepare view
    var values = useState([1, 2, 3]);
    const view = ForEach(values, (e) => ({
      value: e,
      label: 'item',
    }));

    // render view
    const root: any[] = ['root'];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual([
      'root',
      { value: 1, label: 'item' },
      { value: 2, label: 'item' },
      { value: 3, label: 'item' },
    ]);
  });

  it('foreach empty list sync', () => {
    // prepare view
    var values = useState([]);
    const view = ['before', ForEach(values, '-'), 'after'];

    // render view
    const root: any[] = ['root'];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual(['root', ['before', 'after']]);
  });

  it('renders two nested foreach blocks inside a conditional', () => {
    // prepare view
    const visible = useState(true);
    const left = useState([1, 2]);
    const right = useState(['a', 'b']);
    const view = If(visible, [
      'items',
      ForEach(left, (item) => ({ left: item })),
      ForEach(right, (item) => ({ right: item })),
    ]);

    // render view
    const root: any[] = ['root'];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual([
      'root',
      ['items', { left: 1 }, { left: 2 }, { right: 'a' }, { right: 'b' }],
    ]);
  });

  it('renders a foreach nested inside another foreach', () => {
    // prepare view
    const rows = useState(['first', 'second']);
    const values = useState([1, 2]);
    const view = ForEach(rows, () => ['row', ForEach(values, '-')]);

    // render view
    const root: any[] = ['root'];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual(['root', ['row', '-', '-'], ['row', '-', '-']]);
  });

  it('updates kitchensink-shaped derived state without output stack underflow', async () => {
    const count = useState(2);
    const view = [
      {
        doubled: count.map((value) => value * 2),
        summary: count.map((value) => `count:${value}`),
      },
    ];

    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    await sandbox.update(count, 3);

    expect(root[0][0]).toMatchObject({
      doubled: 6,
      summary: 'count:3',
    });
  });

  it('renders the kitchensink foreach feature', async () => {
    const todos = useState([
      { id: 1, title: 'Wire state', done: true },
      // { id: 2, title: 'Render templates', done: false },
    ]);

    const view = [
      ForEach(todos, (todo) => ({
        id: todo.map((item) => item.id),
        title: todo.map((item) => item.title),
        done: todo.map((item) => item.done),
        labels: todo.map((item) => [
          item.done ? 'complete' : 'open',
          `#${item.id}`,
        ]),
      })),
    ];
    const root: any[] = [];
    await render(view, new JsonAutomaton(root));

    expect(root).toStrictEqual([
      [
        {
          id: 1,
          title: 'Wire state',
          done: true,
          labels: ['complete', '#1'],
        },
      ],
    ]);
  });

  it('renders a nested foreach from outer item state', async () => {
    const todos = useState([
      { id: 1, labels: ['complete', '#1'] },
      { id: 2, labels: ['open', '#2'] },
    ]);

    const view = ForEach(todos, (todo) => ({
      id: todo.map((item) => item.id),
      labels: [
        ForEach(
          todo.map((item) => item.labels),
          (label) => label
        ),
      ],
    }));

    const root: any[] = [];
    await render(view, new JsonAutomaton(root));

    expect(root).toStrictEqual([
      {
        id: 1,
        labels: ['complete', '#1'],
      },
      {
        id: 2,
        labels: ['open', '#2'],
      },
    ]);
  });

  it('updates nested item mappings from the same object item state', async () => {
    const todos = useState([{ id: 1, title: 'Wire state', done: true }]);
    const view = ForEach(todos, (todo) => ({
      id: todo.map((item) => item.id),
      title: todo.map((item) => item.title),
      done: todo.map((item) => item.done),
    }));

    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    await sandbox.update(todos, [{ id: 2, title: 'Render templates', done: false }]);

    expect(root).toStrictEqual([
      {
        id: 2,
        title: 'Render templates',
        done: false,
      },
    ]);
  });

  it('updates nested foreach output from a mapped outer item state', async () => {
    const todos = useState([{ id: 1, labels: ['complete', '#1'] }]);
    const view = ForEach(todos, (todo) => ({
      id: todo.map((item) => item.id),
      labels: [ForEach(todo.map((item) => item.labels), (label) => label)],
    }));

    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    await sandbox.update(todos, [{ id: 1, labels: ['open', 'next'] }]);

    expect(root).toStrictEqual([
      {
        id: 1,
        labels: ['open', 'next'],
      },
    ]);
  });

  it('updates root sibling mappings when one branch is async', async () => {
    const count = useState(2);
    const view = [
      {
        doubled: count.map((value) => value * 2),
        summary: count.map((value) => Promise.resolve(`count:${value}`)),
      },
    ];

    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    await sandbox.update(count, 3);

    expect(root[0][0]).toMatchObject({
      doubled: 6,
      summary: 'count:3',
    });
  });

  it('renders mixed object-producing foreach and conditional siblings', () => {
    const visible = useState(true);
    const values = useState([1, 2]);
    const count = useState(2);
    const view = [
      'start',
      ForEach(values, (value) => ({ value })),
      If(visible, {
        summary: count.map((current) => `count:${current}`),
      }),
      'end',
    ];

    const root: any[] = ['root'];
    render(view, new JsonAutomaton(root));

    expect(root).toStrictEqual([
      'root',
      [
        'start',
        { value: 1 },
        { value: 2 },
        { summary: 'count:2' },
        'end',
      ],
    ]);
  });

  it('updates object-valued mapped state across cousin branches', async () => {
    const count = useState(2);
    const view = {
      header: {
        summary: count.map((value) => ({
          label: `count:${value}`,
          doubled: value * 2,
        })),
      },
      footer: {
        metrics: count.map((value) => ({
          current: value,
          squared: value * value,
        })),
      },
    };

    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    await sandbox.update(count, 3);

    expect(root).toStrictEqual([
      {
        header: {
          summary: {
            label: 'count:3',
            doubled: 6,
          },
        },
        footer: {
          metrics: {
            current: 3,
            squared: 9,
          },
        },
      },
    ]);
  });

  it('updates nested object cousins from the same root state', async () => {
    const count = useState(1);
    const view = {
      left: {
        primary: count.map((value) => value + 1),
      },
      right: {
        nested: [
          {
            secondary: count.map((value) => value + 2),
          },
        ],
      },
    };

    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    await sandbox.update(count, 4);

    expect(root).toStrictEqual([
      {
        left: {
          primary: 5,
        },
        right: {
          nested: [
            {
              secondary: 6,
            },
          ],
        },
      },
    ]);
  });

  it('updates nested foreach structures with async item mappings and sibling root state', async () => {
    const status = useState('ready');
    const todos = useState([
      {
        id: 1,
        title: 'Wire state',
        comments: ['first', 'second'],
      },
    ]);

    const view = {
      status: {
        label: status.map((value) => Promise.resolve(`status:${value}`)),
      },
      todos: [
        ForEach(todos, (todo) => ({
          id: todo.map((item) => item.id),
          title: todo.map((item) => Promise.resolve(item.title.toUpperCase())),
          commentCount: todo.map((item) => item.comments.length),
          comments: [
            ForEach(
              todo.map((item) => item.comments),
              (comment) => ({
                text: comment.map((value) => Promise.resolve(value)),
                decorated: comment.map((value) => `#${value}`),
              })
            ),
          ],
        })),
      ],
    };

    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    expect(root).toStrictEqual([
      {
        status: {
          label: 'status:ready',
        },
        todos: [
          {
            id: 1,
            title: 'WIRE STATE',
            commentCount: 2,
            comments: [
              { text: 'first', decorated: '#first' },
              { text: 'second', decorated: '#second' },
            ],
          },
        ],
      },
    ]);

    await sandbox.update(status, 'busy');
    await sandbox.update(todos, [
      {
        id: 2,
        title: 'Render templates',
        comments: ['next'],
      },
      {
        id: 3,
        title: 'Ship fixes',
        comments: ['alpha', 'beta'],
      },
    ]);

    expect(root).toStrictEqual([
      {
        status: {
          label: 'status:busy',
        },
        todos: [
          {
            id: 2,
            title: 'RENDER TEMPLATES',
            commentCount: 1,
            comments: [{ text: 'next', decorated: '#next' }],
          },
          {
            id: 3,
            title: 'SHIP FIXES',
            commentCount: 2,
            comments: [
              { text: 'alpha', decorated: '#alpha' },
              { text: 'beta', decorated: '#beta' },
            ],
          },
        ],
      },
    ]);
  });

});
