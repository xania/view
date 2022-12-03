import { _mappers } from './symbols';

interface State {
  [_mappers]?: ValueMap<this, any>[];
}

export function map<T extends State, U>(value: T, project: (value: T) => U) {
  const mapper = new ValueMap<T, U>(value, project);
  const mappers = value[_mappers] ?? (value[_mappers] = []);
  mappers.push(mapper);
  return mapper;
}

class ValueMap<T, U> {
  public snapshot: U;
  constructor(public parent: T, public project: (t: T) => U) {
    this.snapshot = project(parent);
  }
}
