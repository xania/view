import { describe, expect, it } from 'vitest';
import { render } from '../lib/render';
import { useState } from '../lib/state';
import { JsonAutomaton } from '../lib/json';
import { ForEach } from '../lib/core/for';

describe('render list', () => {
  it('foreach basic', () => {
    // prepare view
    var values = useState([1, 2, 3]);
    const view = ForEach(values, '-');

    // render view
    const root: any[] = ['root'];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual(['root', '-', '-', '-']);
  });

  it('foreach static and sync', () => {
    // prepare view
    var values = useState([1, 2, 3]);
    const view = [1, ForEach(values, '-'), 2];

    // render view
    const root: any[] = ['root'];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual(['root', [1, '-', '-', '-', 2]]);
  });

  it('foreach in property', () => {
    // prepare view
    var values = useState([1, 2, 3]);
    const view = { prop: [1, ForEach(values, '-'), 2] };

    // render view
    const root: any[] = ['root'];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual([
      'root',
      {
        prop: [1, '-', '-', '-', 2],
      },
    ]);
  });

  it('foreach multiple mappings', () => {
    // prepare view
    const values = useState([1]);
    const view = ForEach(values, (v) => ({
      double: v.map((x) => x * 2),
      triple: v.map((x) => x * 3),
    }));

    // render view
    const root: any[] = ['root'];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual([
      'root',
      {
        double: 2,
        triple: 3,
      },
    ]);
  });

  it('foreach item state', async () => {
    // prepare view
    var values = useState([1, 2, 3]);
    const view = ForEach(values, (e) => e);

    // render view
    const root: any[] = ['root'];
    await render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual(['root', 1, 2, 3]);
  });

  it('nested foreach basic', () => {
    // prepare view
    var values = useState([1, 2]);
    var nested = useState([1]);

    const view = ForEach(values, (e) => [e, ForEach(nested, [e, '-'])]);

    // render view
    const root: any[] = ['root'];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual(['root', [1, [1, '-']], [2, [2, '-']]]);
  });

  it('update foreach basic', async () => {
    // prepare view
    var values = useState([1, 2]);

    const view = ForEach(values, '-');

    // render view
    const root: any[] = ['root'];
    const sandbox = await render(view, new JsonAutomaton(root));
    // assert
    expect(root).toStrictEqual(['root', '-', '-']);

    // update
    sandbox.update(values, [1, 2, 3]);

    // assert
    expect(root).toStrictEqual(['root', '-', '-', '-']);
  });

  it('updates foreach sibling mappings from the same item state', async () => {
    const values = useState([1]);
    const view = ForEach(values, (v) => ({
      double: v.map((x) => x * 2),
      triple: v.map((x) => x * 3),
    }));

    const root: any[] = ['root'];
    const sandbox = await render(view, new JsonAutomaton(root));

    await sandbox.update(values, [2]);

    expect(root).toStrictEqual([
      'root',
      {
        double: 4,
        triple: 6,
      },
    ]);
  });

  it('updates foreach async sibling mappings from the same item state', async () => {
    const values = useState([1]);
    const view = ForEach(values, (v) => ({
      double: v.map((x) => Promise.resolve(x * 2)),
      triple: v.map((x) => Promise.resolve(x * 3)),
    }));

    const root: any[] = ['root'];
    const sandbox = await render(view, new JsonAutomaton(root));

    await sandbox.update(values, [2]);

    expect(root).toStrictEqual([
      'root',
      {
        double: 4,
        triple: 6,
      },
    ]);
  });

  it('preserves item frames across reconcile churn', async () => {
    const values = useState([1, 2]);
    const view = ForEach(values, (v) => ({
      value: v,
      double: v.map((x) => x * 2),
    }));

    const root: any[] = ['root'];
    const sandbox = await render(view, new JsonAutomaton(root));

    expect(root).toStrictEqual([
      'root',
      {
        value: 1,
        double: 2,
      },
      {
        value: 2,
        double: 4,
      },
    ]);

    await sandbox.update(values, [2, 3]);

    expect(root).toStrictEqual([
      'root',
      {
        value: 2,
        double: 4,
      },
      {
        value: 3,
        double: 6,
      },
    ]);
  });

  it('updates adjacent foreach siblings from distinct list states independently', async () => {
    // prepare view
    var values1 = useState([1, 2]);
    var values2 = useState([1, 2]);
    const view = [ForEach(values1, '-'), ForEach(values2, '+')];

    // render view
    const root: any[] = ['root'];
    const sandbox = await render(view, new JsonAutomaton(root));

    sandbox.update(values1, [1, 2, 3]);

    // assert
    expect(root).toStrictEqual(['root', ['-', '-', '-', '+', '+']]);
  });

  it('updates adjacent foreach siblings from the same list state', async () => {
    // prepare view
    var values = useState([1, 2]);
    const view = [ForEach(values, '-'), ForEach(values, '+')];

    // render view
    const root: any[] = ['root'];
    const sandbox = await render(view, new JsonAutomaton(root));

    sandbox.update(values, [1, 2, 3]);

    // assert
    expect(root).toStrictEqual(['root', ['-', '-', '-', '+', '+', '+']]);
  });
});
