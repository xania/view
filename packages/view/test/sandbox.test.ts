import { describe, expect, it } from 'vitest';
import { Sandbox, useState } from '../reactivity';

describe('sandbox', () => {
  it('update event proagation', () => {
    const parent = new Sandbox();
    const child = new Sandbox(parent);
    const count = useState(1);
    // parent.graph.update(count, (x) => (x || 0) + 1);
    // expect(child.get(count)).toBe(parent.get(count));
  });
});
