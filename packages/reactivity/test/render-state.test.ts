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

});

function readableAmount(amount: number) {
  return `${(amount / 1000).toFixed(0)}K`;
}
