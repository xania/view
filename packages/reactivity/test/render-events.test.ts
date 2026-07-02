import { describe, expect, it } from 'vitest';
import { JsonAutomaton } from '../lib/json-automaton';
import { render } from '../lib/render';
import { events } from '../lib/json-automaton';
import { useState } from '../lib/state';
import { UpdateCommand } from '../lib/commands/update';
import { ForEach } from '../lib/core/for';

describe('render events', () => {
  it('click events basic', async () => {
    const state = useState(1);

    // prepare view
    const view = {
      state,
      [events]: {
        click: new UpdateCommand(state, 2),
      },
    };

    // render view
    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    sandbox.dispatchEvent(root[0], 'click');

    // assert
    expect(root).toMatchObject([{ state: 2 }]);
  });

  it('click events deep', async () => {
    const state = useState(1);

    const button = {
      state,
      [events]: {
        click: new UpdateCommand(state, 2),
      },
    };
    // prepare view
    const view = {
      state,
      button,
    };

    // render view
    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    sandbox.dispatchEvent(button, 'click');

    // assert
    expect(root).toMatchObject([{ state: 2, obj: { state: 2 } }]);
  });

  it('click events in foreach item body', async () => {
    const state = useState([1]);

    const view = ForEach(state, (item) => ({
      value: item,
      [events]: {
        click: new UpdateCommand(item, 2),
      },
    }));

    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    sandbox.dispatchEvent(root[0], 'click');

    expect(root).toMatchObject([{ value: 2 }]);
  });
});
