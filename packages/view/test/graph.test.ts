import { describe, expect, it } from 'vitest';
import { create } from './lib/graph';
import { useState } from '../reactivity';

describe('graph builder', () => {
  it('trivial', () => {
    const person = useState({ firstName: 'Ibrahim' });
    const graph = create();
    graph.push(person);

    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0]).toBe(person);
  });

  it('prop', () => {
    const person = useState({ firstName: 'Ibrahim' });
    const firstName = person.prop('firstName');
    const graph = create();
    graph.push(firstName);
    graph.push(person);

    expect(graph.nodes).toHaveLength(2);
    expect(graph.nodes[0]).toBe(person);
    expect(graph.nodes[1]).toBe(firstName);
  });

  it('map', () => {
    const person = useState({ firstName: 'Ibrahim' });
    const firstName = person.map((p) => p.firstName);
    const graph = create();
    graph.push(firstName);
    graph.push(person);

    expect(graph.nodes).toHaveLength(2);
    expect(graph.nodes[0]).toBe(person);
    expect(graph.nodes[1]).toBe(firstName);
  });

  it('bind', () => {
    const int = useState(1);
    const double = int.map((x) => x * 2);
    const add3 = int.map((x) => x + 3);
    const display = int.join([double, add3], (x, y) => x + y);
    const graph = create();
    graph.push(display);

    expect(graph.nodes).toHaveLength(4);
    expect(graph.nodes[0]).toBe(int);
    /* expect first two elements should be person and ibrahim in any order */
    expect(graph.nodes.slice(1, 3)).toEqual(
      expect.arrayContaining([double, add3])
    );
    expect(graph.nodes[3]).toBe(display);
  });
});
