import { create } from '../../lib/reactivity/graph';
import { operationProvider } from './operators';

export * from './execution-scope';
export * from './operations';
export * from './compile';
export * from './execute';

export function createGraph() {
  return create(operationProvider);
}
