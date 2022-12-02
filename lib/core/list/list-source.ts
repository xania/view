import { State, _flush } from '../../state';

const _previous: unique symbol = Symbol();
const _included: unique symbol = Symbol();

export function createListSource<T>(initial?: T[]) {
  return new ListSource<T>(initial);
}

type ListObserver<T> = JSX.NextObserver<ListMutation<State<T>>>;

interface ListItem<T> extends State<T> {
  [_included]?: boolean;
}

export class ListSource<T> {
  public readonly observers: ListObserver<T>[] = [];
  public readonly properties: ListItem<T>[] = [];
  public readonly mapObservers: MapObserver<T, any>[] = [];

  constructor(public value: T[] = []) {
    const { properties } = this;
    for (let i = 0; i < value.length; i++) {
      var state = new State<T>(value[i], this.flush);
      properties.push(state);
    }
  }

  subscribe(observer: ListObserver<T>) {
    const { observers, properties } = this;
    observers.push(observer);
    if (properties.length)
      observer.next({
        type: ListMutationType.Flush,
        items: properties,
      });
    return {
      unsubscribe() {
        const idx = observers.indexOf(observer);
        if (idx >= 0) {
          observers.splice(idx, 1);
        }
      },
    };
  }

  next(mut: ListMutation<T>) {
    const { properties } = this;

    const maput: any = {
      ...mut,
    };
    switch (mut.type) {
      case ListMutationType.Clear:
        this.value.length = 0;
        properties.length = 0;
        break;
      case ListMutationType.Append:
        this.value.push(mut.item);
        properties.push((maput.item = new State<T>(mut.item, this.flush)));
        break;
      case ListMutationType.DeleteAt:
        this.value.splice(mut.index, 1);
        properties.splice(mut.index, 1);
        break;
      case ListMutationType.Filter:
        let index = 0;
        for (let i = 0; i < this.properties.length; i++) {
          const prop = this.properties[i];
          const include = mut.predicate(prop.value);
          if (include !== (prop[_included] ?? true)) {
            prop[_included] = include;
            if (include) {
              const fmut: ListMutation<State<T>> = {
                type: ListMutationType.Insert,
                item: prop,
                index,
              };
              for (const o of this.observers) {
                o.next(fmut);
              }
            } else {
              const fmut: ListMutation<T> = {
                type: ListMutationType.DeleteAt,
                index,
              };
              for (const o of this.observers) {
                o.next(fmut);
              }
            }
          }
          if (include) index++;
        }
        return;
    }

    for (const o of this.observers) {
      o.next(maput);
    }

    switch (maput.type) {
      case ListMutationType.Append:
        maput.item.flush();
        break;
      case ListMutationType.DeleteAt:
        this.notifyMapObservers();
        break;
    }
  }

  append(item: T) {
    this.next({
      type: ListMutationType.Append,
      item: item,
    });
  }

  update = (updater: (data: T[]) => void) => {
    updater(this.value);
    this.flush();
  }

  delete = (item: JSX.State<T>) => {
    let index = 0;
    for (const x of this.properties) {
      const included = x[_included] ?? true;
      if (x === item) {
        if (included) {
          this.next({
            type: ListMutationType.DeleteAt,
            index,
          });
        }
        break;
      } else if (included) {
        index++;
      }
    }
  }

  flush = () => {
    if (_flush(this.properties)) {
      this.notifyMapObservers();
      return true;
    }

    return false;
  };

  clear() {
    this.next({
      type: ListMutationType.Clear,
    });
  }

  notifyMapObservers(obs: MapObserver<T, any>[] = this.mapObservers) {
    const items = this.value;
    for (const o of obs) {
      const newValue = o.project(items);
      if ((o as any)[_previous]! !== newValue) {
        (o as any)[_previous] = newValue;
        o.next(o.project(items));
      }
    }
  }

  map<U>(project: (items: T[]) => U) {
    const listSource = this;

    return {
      subscribe(o: JSX.NextObserver<U>) {
        (o as any)['project'] = project;
        listSource.mapObservers.push(o as any);
        listSource.notifyMapObservers([o as any]);

        return {
          unsubscribe() {
            const { mapObservers } = listSource;
            const idx = mapObservers.indexOf(o as any);
            if (idx >= 0) {
              mapObservers.splice(idx, 1);
            } else {
              debugger;
            }
          },
        };
      },
    };
  }

  filter(predicate: (item: T) => boolean) {
    this.next({
      type: ListMutationType.Filter,
      predicate,
    });
  }
}

export enum ListMutationType {
  Append,
  DeleteAt,
  Flush,
  Filter,
  Insert,
  Clear
}

interface ListClearMutation {
  type: ListMutationType.Clear;
}

interface ListAppendMutation<T> {
  type: ListMutationType.Append;
  item: T;
}

interface ListInsertMutation<T> {
  type: ListMutationType.Insert;
  item: T;
  index: number;
}

interface ListDeleteAtMutation {
  type: ListMutationType.DeleteAt;
  index: number;
}

interface ListFlushMutation<T> {
  type: ListMutationType.Flush;
  items: T[];
}

interface ListFilterMutation<T> {
  type: ListMutationType.Filter;
  predicate: (t: T) => boolean;
}

type ListMutation<T> =
  | ListAppendMutation<T>
  | ListDeleteAtMutation
  | ListFlushMutation<T>
  | ListFilterMutation<T>
  | ListInsertMutation<T>
  | ListClearMutation;

type MapObserver<T, U> = JSX.NextObserver<T[]> & { project(items: T[]): U };
