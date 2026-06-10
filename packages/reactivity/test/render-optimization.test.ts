import { describe, expect, it } from 'vitest';
import { render } from '../lib/render';
import { useState } from '../lib/state';
import { JsonAutomaton } from '../lib/json';
import { Instruction, InstructionEnum, Program } from '../lib/program';

describe('render optimization', () => {
  it('multiple derived state read', async () => {
    const count = useState(2);
    const view = [count, count.map((value) => value * 2)];

    const root: any[] = [];
    const sandbox = await render(view, new JsonAutomaton(root));

    const countEvent = sandbox.automaton.events![count.key] as Program;

    expect(countEvent).toMatchObject([
      {
        index: 0,
        type: InstructionEnum.PushIndex,
      },
      {
        index: 0,
        type: InstructionEnum.UpdateArray,
      },
      {
        type: InstructionEnum.MapState,
      },
      {
        type: InstructionEnum.Write,
      },
      {
        index: 1,
        type: InstructionEnum.UpdateArray,
      },
      {
        type: InstructionEnum.PopOutput,
      },
    ] as Program);
  });
});
