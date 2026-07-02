import { describe, expect, it } from 'vitest';
import { JsonAutomaton } from '../lib/json-automaton';
import { render } from '../lib/render';
import { events } from '../lib/json-automaton';
import { ForEach } from '../lib/core/for';
import { useState } from '../lib/state';
import { UpdateCommand } from '../lib/commands/update';

describe('render events', () => {
  it('click events basic', async () => {
    const values = useState([1]);
    const state = useState(1);

    // prepare view
    const view = ForEach(values, [state,
      {
        [events]: {
          click: new UpdateCommand(state, 2),
        },
      },
    ]);

    // render view
    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    sandbox.dispatchEvent(root[0], 'click');

    // assert
    expect(root).toStrictEqual([2, {}]);
  });
});
