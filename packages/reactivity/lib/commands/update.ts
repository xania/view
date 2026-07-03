import { State, Value } from '../state';

type UpdateFunction<T> = (current: T) => Value<T>;

export class UpdateCommand<T> {
  constructor(
    public state: State<T>,
    public value: Value<T> | UpdateFunction<T>
  ) {}
}

export function update<T>(
  state: State<T>,
  value: Value<T> | UpdateFunction<T>
) {
  return new UpdateCommand(state, value);
}
