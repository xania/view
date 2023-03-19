import { describe, it } from 'vitest';
import { signal, UpdateMessage } from '../lib';

describe('signals', () => {
  it('map', () => {
    const count = signal(1);
    const str = count.map(String);

    const update = new UpdateMessage(count, (x) => x + 1);

    console.log(str);
  });
});
