import { describe, expect, it } from 'vitest';
import {
  children,
  events,
  If,
  ForEach,
  JsonAutomaton,
  render,
  UpdateCommand,
  useState,
} from '../lib';

describe('render children', () => {
  it('wraps static child values in the rendered container', () => {
    const view = {
      type: 'object as container',
      [children]: [1, 2],
    };

    const root = {};
    render(view, new JsonAutomaton(root));

    expect(root).toEqual({ [children]: [view] });
  });

  it('renders a state value as a single child and updates it reactively', async () => {
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

  it('renders ForEach output as children and appends new items on update', async () => {
    const values = useState([1, 2]);
    const view = {
      type: 'object as container',
      [children]: ForEach(values, (e) => e),
    };

    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    expect(root).toEqual([
      {
        type: 'object as container',
        [children]: [1, 2],
      },
    ]);

    sandbox.update(values, [1, 2, 3]);

    expect(root).toEqual([
      {
        type: 'object as container',
        [children]: [1, 2, 3],
      },
    ]);
  });

  it('renders conditional children in object containers and updates visibility', async () => {
    const visible = useState(true);
    const view = {
      type: 'object as container',
      [children]: [1, If(visible, 2), 3],
    };

    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    expect(root).toEqual([
      {
        type: 'object as container',
        [children]: [1, 2, 3],
      },
    ]);

    sandbox.update(visible, false);

    expect(root).toEqual([
      {
        type: 'object as container',
        [children]: [1, 3],
      },
    ]);

    sandbox.update(visible, true);

    expect(root).toEqual([
      {
        type: 'object as container',
        [children]: [1, 2, 3],
      },
    ]);
  });

  it('updates ForEach item mappings inside object container children', async () => {
    const values = useState([1, 2]);
    const view = {
      type: 'object as container',
      [children]: ForEach(values, (value) => ({
        value,
        double: value.map((x) => x * 2),
      })),
    };

    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    expect(root).toEqual([
      {
        type: 'object as container',
        [children]: [
          { value: 1, double: 2 },
          { value: 2, double: 4 },
        ],
      },
    ]);

    sandbox.update(values, [2, 3]);

    expect(root).toEqual([
      {
        type: 'object as container',
        [children]: [
          { value: 2, double: 4 },
          { value: 3, double: 6 },
        ],
      },
    ]);
  });

  it('attaches events for object children rendered through the children list', async () => {
    const state = useState(1);
    const command = new UpdateCommand(state, 2);
    const child = {
      value: state,
      [events]: {
        click: command,
      },
    };
    const view = {
      type: 'object as container',
      [children]: [child],
    };

    const root: any[] = [];
    await render(view, new JsonAutomaton(root));

    expect(root[0][children][0][events]).toEqual({
      click: command,
    });
  });
});
