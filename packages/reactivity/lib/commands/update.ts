import { State, Value } from '../state';

export class UpdateCommand<T> {
  constructor(
    public state: State<T>,
    public value: Value<T>
  ) {}
}
