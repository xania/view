import { describe, expect, it } from 'vitest';
import { state, useState } from '../reactivity';
import { createGraph } from './lib';

describe('graph reconcilation', () => {
  it('updates prop', () => {
    const person = useState({ firstName: 'Ibrahim' });
    const firstName = person.prop('firstName');
    const graph = createGraph();
    graph.push(firstName);
    expect(graph.get(firstName)).toBe('Ibrahim');

    const updateResult = graph.update(person, { firstName: 'Ramy' });
    expect(updateResult).toBe(true);
    expect(graph.get(firstName)).toBe('Ramy');
  });

  it('updates computed', () => {
    const person = useState({ firstName: 'Ibrahim' });
    const firstName = person.map((p) => p.firstName);
    const graph = createGraph();
    graph.push(firstName);
    expect(graph.get(firstName)).toBe('Ibrahim');

    const updateResult = graph.update(person, { firstName: 'Ramy' });
    expect(updateResult).toBe(true);
    expect(graph.get(firstName)).toBe('Ramy');
  });

  it('updates join', () => {
    const person = useState({ firstName: 'Ibrahim', lastName: 'ben Salah' });
    const firstName = person.prop('firstName');
    const lastName = person.prop('lastName');
    const fullName = firstName.zip(lastName).map(([fn, ln]) => `${fn} ${ln}`);
    const graph = createGraph();
    graph.push(fullName);
    expect(graph.get(fullName)).toBe(
      `${firstName.initial} ${lastName.initial}`
    );

    const updateResult = graph.update(person, { firstName: 'Ramy' });
    expect(updateResult).toBe(true);
    expect(graph.get(fullName)).toBe(`Ramy ${lastName.initial}`);
  });

  it('updates async', async () => {
    // arrange
    const G = createGraph();

    const person = state({ firstName: 'Ibrahim', lastName: 'ben Salah' });
    const firstName = person.prop('firstName');
    G.push(firstName);

    // act
    await G.update(person, Promise.resolve({ firstName: 'Ramy' }));

    // assert
    expect(G.get(firstName)).toBe(`Ramy`);
  });

  it('concurrent updates async', async () => {
    // arrange
    const G = createGraph();

    const person = state({ firstName: 'Ibrahim', lastName: 'ben Salah' });
    const firstName = person.prop('firstName');
    G.push(firstName);

    // act
    // slow update
    G.update(
      person,
      delay(100).then(() => ({ firstName: 'Rania' }))
    );
    // concurrent update, should override previous although slower
    await G.update(
      person,
      delay(200).then(() => ({ firstName: 'Ramy' }))
    );

    // assert
    expect(G.get(firstName)).toBe(`Ramy`);
  });

  it('zip initial async', async () => {
    // arrange states
    const x = state('x');
    const y = state(Promise.resolve('y'));
    const z = x.zip(y);

    // act
    const initial = await z.initial!;

    // assert
    expect(initial).toEqual(['x', 'y']);
  });

  it('update async', async () => {
    // arrange
    const x = state<number>();
    const y = x.map((a) => Promise.resolve(a + 1));
    const G = createGraph();
    G.push(y);

    // act
    await G.update(x, 2);

    // assert
    expect(G.get(y)).toEqual(3);
  });
});

function delay(ts: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ts);
  });
}
