export interface View<T = unknown> {
  swap(index0: number, index1: number): void;
  clear(): void;
  removeAt(index: number): void;
  update(data: T[]): void;
  move(from: number, to: number): void;
}
