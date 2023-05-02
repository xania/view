interface ColumnProps<T> {
  field: keyof T;
  title?: string;
  group?: string;
  visible?: boolean;
}

export class Column<T> {
  constructor(public props: ColumnProps<T>) {}

  get title() {
    return this.props.title ?? String(this.props.field);
  }

  get field() {
    return this.props.field;
  }
}
