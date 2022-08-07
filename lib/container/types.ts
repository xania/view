export interface ViewContainer<T = unknown> {
  push(data: T[], start?: number, count?: number): void;
  swap(index0: number, index1: number): void;
  clear(): void;
  removeAt(index: number): void;
  map(template: JSX.Element): void;
  length: number;
  update(
    callback: (item: T, idx: number) => string | undefined,
    idx?: number
  ): void;
  itemAt(index: number): T;
}
