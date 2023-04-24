import { sapply } from '@xania/view';
import { Column } from './column';
import { DataSource } from './data-source';
import { List, ListExpression, State } from '@xania/view';

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

  constructor(
    public readonly load: (start: number, end: number) => DataSource<T>,
    public readonly columns: Column<T>[],
    public windowSize = 10
  ) {
    this.ds = new State(load(0, windowSize * 2));
  }

  view() {
    return this.ds.effect((x) => {
      console.log(x);
    });
  }

  Header = (props: HeaderProps<T>) => {
    return this.columns.map((column) => sapply(props.children, [column]));
  };

  Row = (props: RowProps<T>) => {
    return List({ source: this.ds.prop('data'), children: props.children });
  };

  Cell = (props: CellProps<T>) => {
    return this.columns.map((column) => sapply(props.children, [column]));
  };

  updateWindow = debounce((scrollPosition: number, rowHeight: number) => {
    const { windowSize } = this;

    const windowBottom = scrollPosition / rowHeight;

    const offset = windowBottom - (windowBottom % windowSize);

    return this.ds.update((prev) => {
      if (prev.offset === offset) {
        return prev;
      } else {
        const cappedOffset = Math.min(offset, prev.length - 1);

        return this.load(cappedOffset, windowSize * 2);
      }
    });
  });
}

export * from './column';
export * from './data-source';

function debounce<T>(fn: (...args: any[]) => T, ts: number = 10) {
  let current = 0;
  return function (...args: any[]) {
    const handle = Date.now();
    current = handle;
    return new Promise<T>((resolve) => {
      setTimeout(() => {
        if (current === handle) {
          resolve(fn(...args));
        }
      }, ts);
    });
  };
}
