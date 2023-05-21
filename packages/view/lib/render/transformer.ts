export class Transformer<T> {
  constructor(
    public children: JSX.Sequence<T>,
    public transform: (tpl: T) => JSX.Element
  ) {}
}
