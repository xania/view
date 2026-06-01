import { describe, expect, it } from 'vitest';
import { ForEach } from '../lib/core/for';
import { If } from '../lib/core/if';
import { JsonAutomaton } from '../lib/json';
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
      [
        'items',
        { left: 1 },
        { left: 2 },
        { right: 'a' },
        { right: 'b' },
      ],
    ]);
  });

  it('renders a foreach nested inside another foreach', () => {
    // prepare view
    const rows = useState(['first', 'second']);
    const values = useState([1, 2]);
    const view = ForEach(rows, () => [
      'row',
      ForEach(values, '-'),
    ]);

    // render view
    const root: any[] = ['root'];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual([
      'root',
      ['row', '-', '-'],
      ['row', '-', '-'],
    ]);
  });
});
