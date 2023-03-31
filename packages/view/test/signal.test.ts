import { describe, it } from 'vitest';
import { state, UpdateStateCommand } from '../lib';

describe('signals', () => {
  it('map', () => {
    const count = state(1);
    const str = count.map(String);

    const update = new UpdateStateCommand(count, (x) => x + 1);

    console.log(str);
  });
});
