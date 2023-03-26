import { State } from '../state';

export class ListSource<T> {
  constructor(public items: State<T[]>) {}

  next() {}
  add() {}
}
