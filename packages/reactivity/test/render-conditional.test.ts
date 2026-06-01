import { describe, expect, it } from 'vitest';
import { render } from '../lib/render';
import { useState } from '../lib/state';
import { JsonAutomaton } from '../lib/json';
import { If } from '../lib/core/if';

describe('render if', () => {
  it('true branch sync', () => {
    // prepare view
    const view = If(useState(true), 'conditional view');

    // render view
    const root: any[] = [];
    render(view, new JsonAutomaton(root));

    // assert
    expect(root).toStrictEqual(['conditional view']);
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

});
