import { Graph, Signal, State, Value } from './signal';

const rootGraph = new Graph();

export function useState<T = unknown>(): State<T>;
export function useState<T>(initial: Value<T>): State<T>;
export function useState<T>(initial?: Value<T>) {
  return rootGraph.state(initial);
}

export function state<T = unknown>(): State<T>;
export function state<T>(intial: Value<T>): State<T>;
export function state<T>(initial?: Value<T>) {
  const s = new State(rootGraph, initial);
  rootGraph.nodes.push(s);
  return s;
}

export function signal<T = unknown>(): State<T>;
export function signal<T>(intial: Value<T>): State<T>;
export function signal<T>(initial?: Value<T>) {
  const s = new State(rootGraph, initial);
  rootGraph.nodes.push(s);
  return s;
}
