import { List, ListExpression, ListSource, State, tapply } from '@xania/view';
import { Column } from './column';
import { DataSource } from './data-source';

interface HeaderProps<T> {
  children: (column: Column<keyof T>) => JSX.Children;
}

interface RowProps<T> {
  children: ListExpression<T>['children'];
}

interface CellProps<T> {
  children: (column: Column<T>) => JSX.Children;
}

export class Grid<T = any> {
  public readonly ds: State<DataSource<T>>;
  public readonly offset: State<number> = new State(0);

  constructor(
    public readonly load: (start: number, end: number) => DataSource<T>,
    public readonly columns: Column<T>[],
    public maxLength = 20
  ) {
    this.ds = this.offset.map((x) => load(x, maxLength));
  }

  Header = (props: HeaderProps<T>) => {
    return this.columns.map((column) => tapply(props.children, [column]));
  };

  Row = (props: RowProps<T>) => {
    return List({ source: this.ds.prop('data'), children: props.children });
  };

  Cell = (props: CellProps<T>) => {
    return this.columns.map((column) => tapply(props.children, [column]));
  };
}

export * from './column';
export * from './data-source';
