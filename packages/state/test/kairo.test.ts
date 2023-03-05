import { describe, expect, it } from 'vitest';
import { cases, runCase } from './kairo/cases';

describe('kairo bench', () => {
  it('avoidablePropagation', async () => {
    await runCase(cases.avoidablePropagation);
  }, 10000);
  // it('broadPropagation', () => {
  //   return runCase(cases.broadPropagation);
  // }, 10000);
  // it('deepPropagation', () => {
  //   return runCase(cases.deepPropagation);
  // }, 10000);
  // it('diamond', () => {
  //   return runCase(cases.diamond);
  // }, 10000);
  // it('mux', () => {
  //   return runCase(cases.mux);
  // }, 10000);
});
