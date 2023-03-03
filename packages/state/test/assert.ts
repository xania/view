import { expect } from 'vitest';
import { Rx } from '../lib/rx';

export function assertGraph(graph: Rx.Stateful[]) {
  if (!graph.length) return;

  // first
  expect(graph[0].left).toBeUndefined();
  // last
  expect(graph[graph.length - 1].right).toBeUndefined();

  for (let i = 1; i < graph.length; i++) {
    const left = graph[i - 1];
    const curr = graph[i];

    expect(left.right).toBe(curr);
    expect(curr.left).toBe(left);
  }
}
