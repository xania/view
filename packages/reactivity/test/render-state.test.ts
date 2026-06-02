import { describe, expect, it } from 'vitest';
import { render } from '../lib/render';
import { useState } from '../lib/state';
import { JsonAutomaton } from '../lib/json';
// import { DomDescriptorType, isDomDescriptor } from 'xania';
// import { jsx } from 'xania/jsx-runtime';

describe('render state', () => {
  it('trivial sync 123', () => {
    // prepare view
    const view = 'sample view';

    // render view
    const root: any[] = [];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual([view]);
  });

  it('simple state read', () => {
    // prepare view
    const view = ['state: ', useState(1)];

    // render view
    const root: any[] = [];
    render(view, new JsonAutomaton(root));

    // assert
    expect([['state: ', 1]]).toEqual(root);
  });

  it('complex state read', async () => {
    // prepare view
    const x = useState(1);
    const view = ['state: ', x, { a: x, p: { c: x } }];

    // render view
    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    sandbox.update(x, 2);

    // assert
    expect([['state: ', 2, { a: 2, p: { c: 2 } }]]).toEqual(root);
  });
});
