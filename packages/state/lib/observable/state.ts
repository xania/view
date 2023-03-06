import { write } from '../write';
import { Value } from './value';

export class State<T> extends Value<T> {
  constructor(snapshot?: T) {
    super(snapshot);
  }

  // choose ur flavor for write
  set = write;
  next = write;
  write = write;
}
