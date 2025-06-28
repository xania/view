import { describe, expect, it } from 'vitest';
import { render } from '../lib/render';
import { State, useState } from '../lib/state';
import { JsonAutomaton, JToken } from '../lib/json';
import { If } from '../lib/core/if';
import { ForEach, Iterator } from '../lib/core/for';

describe('render list', () => {
  it('foreach static and sync', () => {
    // prepare view
    var values = useState([1, 2, 3]);
    const view = [1, ForEach(values, '-'), 2];

    // render view
    const root: any[] = [];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual([[1, ['-', '-', '-'], 2]]);
  });

  it('foreach on property', () => {
    // prepare view
    var values = useState([1, 2, 3]);
    const view = { bla: [1, ForEach(values, '-'), 2] };

    // render view
    const root: any[] = [];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual([
      {
        bla: [1, ['-', '-', '-'], 2],
      },
    ]);
  });
});
