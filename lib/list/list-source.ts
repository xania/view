export function createListSource<T>(initial?: T[]) {
  return new ListSource<T>(initial);
}

type ListObserver<T> = JSX.NextObserver<ListMutation<T>>;

export class ListSource<T> {
  private observers: ListObserver<T>[] = [];

  constructor(private items: T[] = []) {}

  subscribe(observer: ListObserver<T>) {
    const { observers } = this;
    observers.push(observer);
    observer.next({
      type: ListMutationType.Reset,
      items: this.items,
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
    switch (mut.type) {
      case ListMutationType.Append:
        this.items.push(mut.item);
        break;
      case ListMutationType.Reset:
        this.items = mut.items;
        break;
      case ListMutationType.DeleteAt:
        this.items.splice(mut.index, 1);
        break;
      case ListMutationType.UpdateAt:
        this.items[mut.index] = mut.item;
        break;
    }

    for (const o of this.observers) {
      o.next(mut);
    }
  }

  append(item: T) {
    this.next({
      type: ListMutationType.Append,
      item,
    });
  }

  deleteAt(index: number) {
    this.next({
      type: ListMutationType.DeleteAt,
      index,
    });
  }

  delete(item: T) {
    const index = this.items.indexOf(item);
    if (index >= 0) {
      this.next({
        type: ListMutationType.DeleteAt,
        index,
      });
    }
  }

  updateAt(index: number, updater: Updater<T>) {
    const item = this.items[index];
    this.next({
      type: ListMutationType.UpdateAt,
      index,
      item: updater(item),
    });
  }

  map<U>(project: (items: T[]) => U) {
    const listSource = this;
    return {
      subscribe(o: JSX.NextObserver<U>) {
        const sub = listSource.subscribe({
          next() {
            o.next(project(listSource.items));
          },
        });

        return sub;
      },
    };
  }
}

export enum ListMutationType {
  Reset,
  Append,
  DeleteAt,
  Delete,
  UpdateAt,
}

interface ListResetMutation<T> {
  type: ListMutationType.Reset;
  items: T[];
}

interface ListAppendMutation<T> {
  type: ListMutationType.Append;
  item: T;
}

interface ListDeleteAtMutation {
  type: ListMutationType.DeleteAt;
  index: number;
}

interface ListUpdateAtMutation<T> {
  type: ListMutationType.UpdateAt;
  index: number;
  item: T;
}

type ListMutation<T> =
  | ListResetMutation<T>
  | ListAppendMutation<T>
  | ListDeleteAtMutation
  | ListUpdateAtMutation<T>;

type Updater<T> = (value?: T) => T;
// type Func<T, U> = (value: T) => U;
