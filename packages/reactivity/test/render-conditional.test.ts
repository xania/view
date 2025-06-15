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

  it('reactive branch sync', async () => {
    // prepare view
    var state = useState(false);
    const view = ['left', If(state, 'conditional view'), 'right'];

    // render view
    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    // assert
    sandbox.update(state, true);
    expect(root).toStrictEqual([['left', 'conditional view', 'right']]);

    // assert
    sandbox.update(state, false);
    expect(root).toStrictEqual([['left', 'right']]);
  });

  it('reactive branch with property', async () => {
    // prepare view
    var stateP = useState(false);
    var stateC = useState(false);
    const view = {
      p: If(stateP, Promise.resolve('conditional view')),
      a: Promise.resolve(123),
      c: If(stateC, 'bla'),
    };

    // render view
    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    // assert
    sandbox.update(stateP, true);
    expect(root).toStrictEqual([
      {
        /*promises values are 'naturally resolves'*/
        p: 'conditional view',
        a: 123,
      },
    ]);

    // assert
    sandbox.update(stateP, false);
    expect(root).toStrictEqual([{ p: undefined, a: 123 }]);
  });
});
