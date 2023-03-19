import { MapOperator } from './operators';

export class Signal2<T = any> {
  operators: MapOperator<T, any>[] = [];

  constructor(public readonly snapshot?: T) {}

  map<U>(mapper: (x: T) => U): Signal2<U> {
    const { snapshot } = this;
    const m = new Signal2<U>(
      snapshot !== undefined ? mapper(snapshot) : undefined
    );

    this.operators.push({
      mapper,
      target: m,
    });

    return m;
  }
}
