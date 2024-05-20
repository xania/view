import { describe, expect, it } from 'vitest';
import { State, useState } from '../reactivity';
import { OperatorEnum, create } from './lib/graph';
import { operationProvider } from './lib/operators';

describe('graph reconcilation', () => {
  it('updates prop', () => {
    const person = useState({ firstName: 'Ibrahim' });
    const firstName = person.prop('firstName');
    const graph = create(operationProvider);
    graph.push(firstName);
    expect(graph.get(firstName)).toBe('Ibrahim');

    const updateResult = graph.update(person, { firstName: 'Ramy' });
    expect(updateResult).toBe(true);
    expect(graph.get(firstName)).toBe('Ramy');
  });

  it('updates computed', () => {
    const person = useState({ firstName: 'Ibrahim' });
    const firstName = person.map((p) => p.firstName);
    const graph = create(operationProvider);
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
    const fullName = firstName
      .join([lastName])
      .map(([fn, ln]) => `${fn} ${ln}`);
    const graph = create(operationProvider);
    graph.push(fullName);
    expect(graph.get(fullName)).toBe(
      `${firstName.initial} ${lastName.initial}`
    );

    const updateResult = graph.update(person, { firstName: 'Ramy' });
    expect(updateResult).toBe(true);
    expect(graph.get(fullName)).toBe(`Ramy ${lastName.initial}`);
  });
});
