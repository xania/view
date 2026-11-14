import { expect, it } from 'vitest';
import { children, ForEach, If, JsonAutomaton, render, useState } from '../lib';

it('experiment: updates an initially hidden body before showing it', async () => {
  const visible = useState(false);
  const value = useState('before');
  const root: any[] = [];
  const sandbox = await render(If(visible, { value }), new JsonAutomaton(root));

  await sandbox.update(value, 'after');
  await sandbox.update(visible, true);
  expect(root).toStrictEqual([{ value: 'after' }]);
});

it('experiment: restores updates made after hiding a visible body', async () => {
  const visible = useState(true);
  const value = useState('before');
  const root: any[] = [];
  const sandbox = await render(If(visible, { value }), new JsonAutomaton(root));

  await sandbox.update(visible, false);
  await sandbox.update(value, 'after');
  await sandbox.update(visible, true);
  expect(root).toStrictEqual([{ value: 'after' }]);
});

it('experiment: preserves nested conditional updates while the outer body is hidden', async () => {
  const outer = useState(false);
  const inner = useState(false);
  const value = useState('before');
  const root: any[] = [];
  const sandbox = await render(
    If(outer, { value, [children]: If(inner, 'inside') }),
    new JsonAutomaton(root)
  );

  await sandbox.update(value, 'after');
  await sandbox.update(inner, true);
  await sandbox.update(outer, true);
  expect(root).toStrictEqual([{ value: 'after', [children]: ['inside'] }]);
});

it.each([false, true])(
  'experiment: restores distinct hidden item values (async=%s)',
  async (asyncValues) => {
    const visible = useState(false);
    const root: any[] = [];
    const sandbox = await render(
      ForEach(useState(['a', 'b']), (item) => ({
        [children]: If(
          visible,
          item.map((value) => (asyncValues ? Promise.resolve(value) : value))
        ),
      })),
      new JsonAutomaton(root)
    );

    await sandbox.update(visible, true);
    expect(root).toStrictEqual([
      { [children]: ['a'] },
      { [children]: ['b'] },
    ]);
  }
);
