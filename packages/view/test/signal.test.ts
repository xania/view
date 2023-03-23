import { describe, it } from 'vitest';
import { state, UpdateCommand } from '../lib';

describe('signals', () => {
  it('map', () => {
    const count = state(1);
    const str = count.map(String);

    const update = new UpdateCommand(count, (x) => x + 1);

    console.log(str);
  });
});
