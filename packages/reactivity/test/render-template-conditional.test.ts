import { expect, it } from 'vitest';
import { children, ForEach, If, JsonAutomaton, render, useState } from '../lib';

it('renders item state inside a conditional in a list template', async () => {
  const root: any[] = [];
  const view = ForEach(useState(['a']), (item) => ({
    [children]: If(useState(true), item),
  }));

  await render(view, new JsonAutomaton(root));

  expect(root).toStrictEqual([{ [children]: ['a'] }]);
});
