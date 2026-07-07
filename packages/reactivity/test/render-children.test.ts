import { describe, expect, it } from 'vitest';
import { children, ForEach, JsonAutomaton, render, useState } from '../lib';

describe('render children', () => {
  it('renders an initial children list', () => {
    const view = {
      type: 'object as container',
      [children]: [1, 2],
    };

    const root = {};
    render(view, new JsonAutomaton(root));

    expect(root).toEqual({ [children]: [view] });
  });

  it('renders an state in children list', async () => {
    const s1 = useState(1);
    const view = {
      type: 'object as container',
      [children]: s1,
    };

    const root = {};
    const sandbox = await render(view, new JsonAutomaton(root));

    expect(root).toEqual({
      [children]: [
        {
          type: 'object as container',
          [children]: [1],
        },
      ],
    });

    sandbox.update(s1, 2);

    expect(root).toEqual({
      [children]: [
        {
          type: 'object as container',
          [children]: [2],
        },
      ],
    });
  });

  it('renders an reactive children list', async () => {
    const values = useState([1, 2]);
    const view = {
      type: 'object as container',
      [children]: ForEach(values, (e) => e),
    };

    const root = {};
    const sandbox = await render(view, new JsonAutomaton(root));

    expect(root).toEqual({
      [children]: [
        {
          type: 'object as container',
          [children]: [1, 2],
        },
      ],
    });

    sandbox.update(values, [1, 2, 3]);

    expect(root).toEqual({
      [children]: [
        {
          type: 'object as container',
          [children]: [2],
        },
      ],
    });
  });
});
