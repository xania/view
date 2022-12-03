import { digest, DirtyItem, State, _flush } from '../../state';
import { ListMutation, ListMutationType } from './mutation';

const _previous: unique symbol = Symbol();
const _included: unique symbol = Symbol();
const _index: unique symbol = Symbol();

export function createListSource<T>(initial?: T[]) {
  return new ListSource<T>(initial);
}

type ListObserver<T> = JSX.NextObserver<ListMutation<State<T>>>;

interface ListItem<T> extends State<T> {
  [_included]?: boolean;
  [_index]: number;
}

export class ListSource<T> {
  public readonly observers: ListObserver<T>[] = [];
  public readonly properties: ListItem<T>[] = [];
  public readonly mapObservers: MapObserver<T, any>[] = [];

  constructor(public snapshot: T[] = []) {
    const { properties } = this;
    for (let i = 0; i < snapshot.length; i++) {
      var state: ListItem<T> = new State<T>(snapshot[i], this.flushItem) as any;
      state[_index] = i;
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
        this.snapshot.length = 0;
        properties.length = 0;
        break;
      case ListMutationType.Append:
        this.snapshot.push(mut.item);
        const state: ListItem<T> = new State<T>(
          mut.item,
          this.flushItem
        ) as any;
        state[_index] = properties.length;
        properties.push((maput.item = state));
        break;
      case ListMutationType.DeleteAt:
        this.snapshot.splice(mut.index, 1);
        properties.splice(mut.index, 1);
        for (let i = mut.index, len = properties.length; i < len; i++) {
          properties[i][_index] = i;
        }
        break;
      case ListMutationType.Move:
        const stmp = this.snapshot[mut.from];
        this.snapshot[mut.from] = this.snapshot[mut.to];
        this.snapshot[mut.to] = stmp;
        const ptmp = this.properties[mut.from];
        this.properties[mut.from] = this.properties[mut.to];
        this.properties[mut.from][_index] = mut.from;
        this.properties[mut.to] = ptmp;
        this.properties[mut.to][_index] = mut.to;
        break;
      case ListMutationType.Filter:
        let index = 0;
        for (let i = 0; i < this.properties.length; i++) {
          const prop = this.properties[i];
          const include = mut.predicate(prop.snapshot);
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

  update = (updater: (data: T[]) => T[] | void) => {
    const newSnapshot = updater(this.snapshot) ?? this.snapshot;

    const { properties } = this;
    let idx = 0,
      slen = newSnapshot.length,
      plen = properties.length;
    while (idx < slen && idx < plen) {
      const prop = properties[idx];
      prop.snapshot = newSnapshot[idx];
      idx++;
      this.flushItem(prop);
    }

    if (idx < plen) {
      properties.length = idx;
    } else
      while (idx < slen) {
        this.next({
          type: ListMutationType.Append,
          item: newSnapshot[idx++],
        });
      }

    // const mutations = reconcile(this.properties, newSnapshot);
    // for (const o of this.observers) {
    //   for (const mut of mutations) {
    //     o.next(mut);
    //   }
    // }

    // for (const prop of properties) this.flushItem(prop);

    // console.log(mutations);
    // this.flush();
  };

  delete = (item: JSX.State<T>) => {
    let index = 0;
    const { properties } = this;
    for (let i = 0, len = properties.length; i < len; i++) {
      const x = properties[i];
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
  };

  flushItem = (item: DirtyItem) => {
    if (!item.parent) {
      const idx = (item as ListItem<T>)[_index];
      this.next({
        type: ListMutationType.Update,
        index: idx,
      });
    } else {
      const items: DirtyItem[] = [item];
      let root = item;
      while (root.parent) {
        root = root.parent;
        items.push(root);
      }

      const dirty = digest(items);
      for (const o of dirty as any) {
        o.next(o[_previous]);
      }
    }
    return false;
    // return dirty.length > 0;

    // if (_flush(items)) {
    //   this.notifyMapObservers();
    //   return true;
    // }

    // return false;
  };

  clear() {
    this.next({
      type: ListMutationType.Clear,
    });
  }

  notifyMapObservers(obs: MapObserver<T, any>[] = this.mapObservers) {
    const items = this.snapshot;
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

type MapObserver<T, U> = JSX.NextObserver<T[]> & {
  project(items: T[]): U;
};
