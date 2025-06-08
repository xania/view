import { describe, expect, it } from 'vitest';
import { render } from '../lib/render';
import { State, useState } from '../lib/state';
import { JsonAutomaton, JToken } from '../lib/json';
import { If } from '../lib/components/if';

describe('render if', () => {
  it('true branch sync', () => {
    // prepare view
    const view = If(useState(true), 'conditional view');

    // render view
    const root: any[] = [];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual([view.body]);
  });

  it('false branch sync', () => {
    // prepare view
    const view = If(useState(false), 'conditional view');

    // render view
    const root: any[] = [];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual([]);
  });

  it('reactive sync', async () => {
    // prepare view
    var state = useState(false);
    const view = If(state, 'conditional view');

    // render view
    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    sandbox.update(state, true);

    // assert
    expect(root).toStrictEqual([view.body]);
  });
});
