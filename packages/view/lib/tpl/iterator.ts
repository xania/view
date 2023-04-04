export class TemplateIterator<T = any> {
  constructor(
    iterable: Iterable<T>,
    public iter = iterable[Symbol.iterator]()
  ) {}
}
