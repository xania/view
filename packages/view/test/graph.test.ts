import { describe, expect, it } from 'vitest';
import { createGraph } from './lib';
import { Graph, useState } from '../reactivity';

describe('graph builder', () => {
  it('trivial state', () => {
    const graph = new Graph();

    const person = graph.state({ firstName: 'Ibrahim' });

    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0]).toBe(person);
  });

  it('prop operator', () => {
    const graph = new Graph();
    const person = graph.state({ firstName: 'Ibrahim' });
    const firstName = person.prop('firstName');

    expect(graph.nodes).toHaveLength(2);
    expect(graph.nodes[0]).toBe(person);
    expect(graph.nodes[1]).toBe(firstName);

    expect(graph.operators).toHaveLength(1);
  });

  it('map operator', () => {
    const graph = new Graph();

    const person = graph.state({ firstName: 'Ibrahim' });
    const firstName = person.map((p) => p.firstName);

    expect(graph.nodes).toHaveLength(2);
    expect(graph.nodes[0]).toBe(person);
    expect(graph.nodes[1]).toBe(firstName);

    expect(graph.operators).toHaveLength(1);
  });

  it('bind operator', () => {
    const graph = new Graph();

    const int = graph.state(1);
    const double = int.map((x) => x * 2);
    const add3 = int.map((x) => x + 3);
    const display = int.bind(double, add3).map(([x, y]) => x + y);

    // graph.push(display);

    expect(graph.nodes).toHaveLength(6);
    expect(graph.nodes[0]).toBe(int);
    /* expect first two elements should be person and ibrahim in any order */
    expect(graph.nodes.slice(1, 3)).toEqual(
      expect.arrayContaining([double, add3])
    );
    // expect(graph.nodes[5]).toBe(display);
  });
});
