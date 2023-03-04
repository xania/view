/** interface for a reactive framework.
 *
 * Implement this interface to add a new reactive framework to the test and performance test suite.
 */
export interface ReactiveFramework {
  name: string;
  signal<T>(initialValue: T, label?: string): Signal<T>;
  computed<T>(fn: () => T, label?: string): Computed<T>;
  effect(fn: () => void, label?: string): void;
  withBatch<T>(fn: () => T): void;
  withBuild<T>(fn: () => T): T;
  run(): void;
  assert<T>(x: T, y: T, message?: string);
}

export interface Signal<T> {
  read(): T;
  write(v: T): void;
}

export interface Computed<T> {
  read(): T;
}
