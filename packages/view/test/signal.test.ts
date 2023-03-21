import { describe, it } from 'vitest';
import { state, UpdateMessage } from '../lib';

describe('signals', () => {
  it('map', () => {
    const count = state(1);
    const str = count.map(String);

    const update = new UpdateMessage(count, (x) => x + 1);

    console.log(str);
  });
});
