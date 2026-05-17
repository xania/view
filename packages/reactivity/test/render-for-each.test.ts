import { describe, expect, it } from 'vitest';
import { render } from '../lib/render';
import { State, useState } from '../lib/state';
import { JsonAutomaton, JToken } from '../lib/json';
import { If } from '../lib/core/if';
import { ForEach, Iterator } from '../lib/core/for';

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

  it('foreach on property', () => {
    // prepare view
    var values = useState([1, 2, 3]);
    const view = { bla: [1, ForEach(values, '-'), 2] };

    // render view
    const root: any[] = ['root'];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual([
      'root',
      {
        bla: [1, '-', '-', '-', 2],
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
});
