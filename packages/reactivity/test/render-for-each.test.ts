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

  it('foreach on state', async () => {
    // prepare view
    const s = useState(3);
    var values = useState([1, 2, 3]);
    const view = ForEach(values, s);

    // render view
    const root: any[] = ['root'];
    const sandbox = await render(view, new JsonAutomaton(root));
    await sandbox.update(s, 4);

    // assert
    expect(root).toStrictEqual(['root', 4, 4, 4]);
  });

  it('foreach on complex state', async () => {
    // prepare view
    const s = useState(3);
    var values = useState([1, 2]);
    const view = ForEach(values, { s });

    // render view
    const root: any[] = ['root'];
    const sandbox = await render(view, new JsonAutomaton(root));
    await sandbox.update(s, 4);

    // assert
    expect(root).toStrictEqual(['root', { s: 4 }, { s: 4 }]);
  });

  it('foreach item state', () => {
    // prepare view
    var values = useState([1, 2, 3]);
    const view = ForEach(values, (e) => e);

    // render view
    const root: any[] = ['root'];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual(['root', 1, 2, 3]);
  });

  it('foreach complex item state', () => {
    // prepare view
    var values = useState([1, 2, 3]);
    const view = ForEach(values, (e) => ({
      s: e,
    }));

    // render view
    const root: any[] = ['root'];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual(['root', { s: 1 }, { s: 2 }, { s: 3 }]);
  });
});
