import { State, _flush } from '../state';

export function createListSource<T>(initial?: T[]) {
  return new ListSource<T>(initial);
}

type ListObserver<T> = JSX.NextObserver<ListMutation<T>>;

export class ListSource<T> {
  public readonly observers: ListObserver<State<T>>[] = [];
  public readonly properties: State<T>[] = [];
  public readonly mapObservers: MapObserver<T>[] = [];

  constructor(public value: (T | null)[] = []) {
    const { properties } = this;
    for (let i = 0; i < value.length; i++) {
      var state = new State<T>(value[i], this.flush);
      properties.push(state);
    }
  }

  subscribe(observer: ListObserver<State<T>>) {
    const { observers } = this;
    observers.push(observer);
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
      case ListMutationType.Append:
        this.value.push(mut.item);
        properties.push((maput.item = new State<T>(mut.item, this.flush)));
        break;
      case ListMutationType.DeleteAt:
        this.value.splice(mut.index, 1);
        properties.splice(mut.index, 1);

        break;
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

  deleteAt(index: number) {
    this.next({
      type: ListMutationType.DeleteAt,
      index,
    });
  }

  delete(item: T) {
    const index = this.value.indexOf(item);
    if (index >= 0) {
      this.next({
        type: ListMutationType.DeleteAt,
        index,
      });
    }
  }

  flush = () => {
    if (_flush(this.properties)) {
      this.notifyMapObservers();
      return true;
    }

    return false;
  };

  notifyMapObservers(obs: MapObserver<T>[] = this.mapObservers) {
    const items = this.value;
    for (const o of obs) {
      o.next(o.project(items as any[]));
    }
  }

  map<U>(project: (items: (T | null)[]) => U) {
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
            mapObservers.splice(idx, 1);
          },
        };
      },
    };
  }
}

export enum ListMutationType {
  Append,
  DeleteAt,
  Flush,
  Delete,
}

interface ListAppendMutation<T> {
  type: ListMutationType.Append;
  item: T;
}

interface ListDeleteAtMutation {
  type: ListMutationType.DeleteAt;
  index: number;
}

interface ListFlushMutation<T> {
  type: ListMutationType.Flush;
  items: T[];
}

interface ListDeleteMutation {
  type: ListMutationType.Delete;
  delete: JSX.ViewContext<any>['key'];
}

type ListMutation<T> =
  | ListAppendMutation<T>
  | ListDeleteAtMutation
  | ListFlushMutation<T>
  | ListDeleteMutation;

type MapObserver<T> = JSX.NextObserver<T> & { project(items: T[]): any };
