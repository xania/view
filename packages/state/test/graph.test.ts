import { describe, expect, it } from 'vitest';
import { connect } from '../lib/graph';
import type { Rx } from '../lib/rx';
import { signal } from '../lib/signal/signal';
import { assertGraph } from './assert';

function node(label: string) {
  return signal(0, label) as Rx.Stateful;
}

function nodes() {
  return {
    A: node('A'),
    B: node('B'),
    C: node('C'),
    D: node('D'),
    E: node('E'),
  };
}

describe('graph', () => {
  it('basic', () => {
    const { A, B } = nodes();

    connect(A, B);

    assertGraph([A, B]);
  });

  it('associativity 1', () => {
    const { A, B, C } = nodes();

    connect(A, B);
    connect(B, C);

    assertGraph([A, B, C]);
  });

  it('associativity 2', () => {
    const { A, B, C } = nodes();

    connect(B, C);
    connect(A, B);

    assertGraph([A, B, C]);
  });

  it('associativity 3', () => {
    const { A, B, C, D } = nodes();

    connect(A, B);
    connect(C, D);

    connect(B, C);

    assertGraph([A, B, C, D]);
  });

  it('merge 1', () => {
    const { A, B, C } = nodes();

    connect(B, C);
    connect(A, C);

    assertGraph([A, B, C]);
  });

  it('merge 2', () => {
    const { A, B, C, D } = nodes();

    connect(A, B);
    connect(B, C);
    connect(B, D);

    assertGraph([A, B, C, D]);
  });

  it('merge 3', () => {
    const { A, B, C, D } = nodes();

    connect(A, B);
    connect(B, C);
    connect(D, B);

    assertGraph([D, A, B, C]);
  });

  it('circular', () => {
    const { A, B } = nodes();

    connect(A, B);
    connect(B, A);

    assertGraph([B, A]);
  });
});
