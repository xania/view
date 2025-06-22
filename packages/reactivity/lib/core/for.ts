import { State } from '../state';

export function ForEach<T>(expr: State<T[]>, body: any) {
  return new Iterator(expr, body);
}

export class Iterator<T> {
  constructor(
    public expr: State<T[]>,
    public body: any
  ) {}
}
