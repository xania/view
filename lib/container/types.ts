export interface ViewContainer<T = unknown> {
  push(data: T[], start?: number, count?: number): void;
  swap(index0: number, index1: number): void;
  clear(): void;
  removeAt(index: number): void;
  map(template: any): void;
  length: number;
  update(callback: (data: T[]) => void): void;
  itemAt(index: number): T;
}
