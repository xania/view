import { describe, expect, it } from 'vitest';
import {
  children,
  events,
  ForEach,
  If,
  JsonAutomaton,
  render,
  type,
  UpdateCommand,
  useState,
} from '../lib';

describe('render all features', () => {
  it('updates events, async state, nested conditionals, and nested list children together', async () => {
    const count = useState(1);
    const status = useState(Promise.resolve('ready'));
    const visible = useState(true);
    const detailsVisible = useState(true);
    const initialRows = [
      { id: 1, title: 'first', comments: ['alpha', 'beta'] },
      { id: 2, title: 'second', comments: [] },
    ];
    const rows = useState(initialRows);
    const increment = new UpdateCommand(count, (current) => current + 1);
    const toggle = new UpdateCommand(visible, (current) => !current);
    const view = Promise.resolve({
      [type]: 'application',
      title: Promise.resolve('Nested demo'),
      header: {
        count,
        doubled: count.map((current) => current * 2),
        status: status.map((current) => Promise.resolve(`status:${current}`)),
      },
      controls: {
        increment: {
          [type]: 'button',
          label: 'Increment',
          [events]: { click: increment },
        },
        toggle: {
          [type]: 'button',
          label: 'Toggle',
          [events]: { click: toggle },
        },
      },
      [children]: [
        'before',
        null,
        If(visible, {
          [type]: 'board',
          label: 'Rows',
          [children]: ForEach(rows, (row) => ({
            [type]: 'row',
            id: row.map((current) => current.id),
            title: row.map((current) =>
              Promise.resolve(current.title.toUpperCase())
            ),
            count,
            commentCount: row.map((current) => current.comments.length),
            [children]: [
              'row-start',
              If(detailsVisible, {
                [type]: 'details',
                label: 'Comments',
                [children]: ForEach(
                  row.map((current) => current.comments),
                  (comment) => ({
                    [type]: 'comment',
                    text: comment.map((current) => Promise.resolve(current)),
                    decorated: comment.map((current) => `#${current}`),
                  })
                ),
              }),
              'row-end',
            ],
          })),
        }),
        undefined,
        'after',
      ],
    });
    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    const expected = (
      currentRows: typeof initialRows,
      currentCount: number,
      currentStatus: string,
      showBoard: boolean,
      showDetails: boolean
    ) => [
      {
        [type]: 'application',
        title: 'Nested demo',
        header: {
          count: currentCount,
          doubled: currentCount * 2,
          status: `status:${currentStatus}`,
        },
        controls: {
          increment: {
            [type]: 'button',
            label: 'Increment',
            [events]: { click: increment },
          },
          toggle: {
            [type]: 'button',
            label: 'Toggle',
            [events]: { click: toggle },
          },
        },
        [children]: [
          'before',
          ...(showBoard
            ? [
                {
                  [type]: 'board',
                  label: 'Rows',
                  [children]: currentRows.map((row) => ({
                    [type]: 'row',
                    id: row.id,
                    title: row.title.toUpperCase(),
                    count: currentCount,
                    commentCount: row.comments.length,
                    [children]: [
                      'row-start',
                      ...(showDetails
                        ? [
                            {
                              [type]: 'details',
                              label: 'Comments',
                              [children]: row.comments.map((comment) => ({
                                [type]: 'comment',
                                text: comment,
                                decorated: `#${comment}`,
                              })),
                            },
                          ]
                        : []),
                      'row-end',
                    ],
                  })),
                },
              ]
            : []),
          'after',
        ],
      },
    ];

    expect(root).toStrictEqual(expected(initialRows, 1, 'ready', true, true));

    await sandbox.dispatchEvent(root[0].controls.increment, 'click');
    expect(root).toStrictEqual(expected(initialRows, 2, 'ready', true, true));

    await sandbox.update(status, Promise.resolve('busy'));
    expect(root).toStrictEqual(expected(initialRows, 2, 'busy', true, true));

    await sandbox.update(detailsVisible, false);
    expect(root).toStrictEqual(expected(initialRows, 2, 'busy', true, false));
    await sandbox.update(detailsVisible, true);
    expect(root).toStrictEqual(expected(initialRows, 2, 'busy', true, true));

    const nextRows = [
      initialRows[1],
      { id: 3, title: 'third', comments: ['gamma'] },
      initialRows[0],
    ];
    await sandbox.update(rows, nextRows);
    expect(root).toStrictEqual(expected(nextRows, 2, 'busy', true, true));

    await sandbox.dispatchEvent(root[0].controls.toggle, 'click');
    expect(root).toStrictEqual(expected(nextRows, 2, 'busy', false, true));
    await sandbox.update(rows, []);
    await sandbox.dispatchEvent(root[0].controls.increment, 'click');
    expect(root).toStrictEqual(expected([], 3, 'busy', false, true));
    await sandbox.dispatchEvent(root[0].controls.toggle, 'click');
    expect(root).toStrictEqual(expected([], 3, 'busy', true, true));

    const refilledRows = [
      { id: 4, title: 'fourth', comments: ['delta', 'epsilon'] },
    ];
    await sandbox.update(rows, refilledRows);
    expect(root).toStrictEqual(expected(refilledRows, 3, 'busy', true, true));
  });
});
