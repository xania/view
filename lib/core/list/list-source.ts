import { _flush } from '../../state';
import { ListMutation, ListMutationType } from './mutation';

const _previous: unique symbol = Symbol();
const _included: unique symbol = Symbol();
const _index: unique symbol = Symbol();

export function createListSource<T extends {}>(initial?: T[]) {
  return new ListSource<T>(initial);
}

type ListObserver<T> = JSX.NextObserver<ListMutation<T>>;

type ListItem<T> = {
  [P in keyof T]: T[P];
} & { [_index]?: number; [_included]?: boolean };

interface List<out T> {
  [k: number]: T;
  length: number;
}

export class ListSource<T> implements List<ListItem<T>> {
  public readonly observers: ListObserver<T>[] = [];
  public readonly mapObservers: MapObserver<T, any>[] = [];

  constructor(snapshot: T[] = []) {
    let length = snapshot.length;
    this.length = length;
    while (length--) {
      const item: ListItem<T> = snapshot[length] as ListItem<T>;
      if (item) {
        item[_index] = length;
        this[length] = item;
      } else {
        this[length] = { [_index]: length } as ListItem<T>;
      }
    }
  }

  [k: number]: ListItem<T>;
  length: number;

  subscribe(observer: ListObserver<T>) {
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
    const length = this.length;
    switch (mut.type) {
      case ListMutationType.Clear:
        this.length = 0;
        break;
      case ListMutationType.Push:
        const item = mut.item as ListItem<T>;
        if (item) {
          item[_index] = length;
          this[length] = item;
        } else {
          this[length] = { [_index]: length } as ListItem<T>;
        }
        this.length = length + 1;
        break;
      case ListMutationType.Concat:
        const offset = this.length;
        for (let i = 0, n = offset, len = mut.items.length; i < len; i++, n++) {
          const item = mut.items[i] as ListItem<T>;
          if (item) {
            item[_index] = n;
            this[n] = item;
          } else {
            this[n] = { [_index]: length } as ListItem<T>;
          }
        }
        this.length = length + mut.items.length;
        break;
      case ListMutationType.DeleteAt:
        this.length = length - 1;
        for (let i = mut.index, len = length - 1; i < len; i++) {
          const next = this[i + 1];
          this[i] = next;
          next[_index] = i;
        }
        break;
      case ListMutationType.Move:
        const { from, to } = mut;
        const itemToMove = this[from];
        if (from < to) {
          for (let i = from; i < to; i++) {
            this[i] = this[i + 1];
            this[i][_index] = i;
          }
        } else {
          for (let i = from; i > to; i--) {
            this[i] = this[i - 1];
            this[i][_index] = i;
          }
        }
        this[to] = itemToMove;
        break;
      case ListMutationType.Filter:
        // let index = 0;
        // for (let i = 0; i < this.properties.length; i++) {
        //   const prop = this.properties[i];
        //   const include = mut.predicate(prop.snapshot);
        //   if (include !== (prop[_included] ?? true)) {
        //     prop[_included] = include;
        //     if (include) {
        //       const fmut: ListMutation<State<T>> = {
        //         type: ListMutationType.Insert,
        //         item: prop,
        //         index,
        //       };
        //       for (const o of this.observers) {
        //         o.next(fmut);
        //       }
        //     } else {
        //       const fmut: ListMutation<T> = {
        //         type: ListMutationType.DeleteAt,
        //         index,
        //       };
        //       for (const o of this.observers) {
        //         o.next(fmut);
        //       }
        //     }
        //   }
        //   if (include) index++;
        // }
        return;
    }

    const { observers } = this;
    let olen = observers.length;
    while (olen--) {
      const o = observers[olen];
      o.next(mut);
    }

    // switch (mut.type) {
    //   case ListMutationType.DeleteAt:
    //     this.notifyMapObservers();
    //     break;
    // }
  }

  push(item: T) {
    this.next({
      type: ListMutationType.Push,
      item: item,
    });
  }

  append(items: ArrayLike<T>) {
    this.next({
      type: ListMutationType.Concat,
      items: items,
    });
  }

  update = (updater?: (data: List<T>) => ArrayLike<T> | void) => {
    if (updater instanceof Function) {
      const newSnapshot = updater(this);
      if (newSnapshot) {
      } else {
      }
    }

    this.next({
      type: ListMutationType.Update,
      offset: 0,
      length: this.length,
    });

    // const { properties } = this;
    // let idx = 0,
    //   slen = newSnapshot.length,
    //   plen = properties.length;
    // while (idx < slen && idx < plen) {
    //   const prop = properties[idx];
    //   prop.snapshot = newSnapshot[idx];
    //   idx++;
    //   this.flushItem(prop);
    // }

    // if (idx < plen) {
    //   properties.length = idx;
    // } else
    //   while (idx < slen) {
    //     this.next({
    //       type: ListMutationType.Append,
    //       item: newSnapshot[idx++],
    //     });
    //   }

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

  delete = (item: T) => {
    let index = 0;
    for (let i = 0, len = this.length; i < len; i++) {
      const x = this[i];
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

  // flushItem = (item: DirtyItem) => {
  //   if (!item.parent) {
  //     const idx = (item as ListItem<T>)[_index];
  //     this.next({
  //       type: ListMutationType.Update,
  //       index: idx,
  //     });
  //   } else {
  //     const items: DirtyItem[] = [item];
  //     let root = item;
  //     while (root.parent) {
  //       root = root.parent;
  //       items.push(root);
  //     }

  //     const dirty = digest(items);
  //     for (const o of dirty as any) {
  //       o.next(o[_previous]);
  //     }
  //   }
  //   return false;
  //   // return dirty.length > 0;

  //   // if (_flush(items)) {
  //   //   this.notifyMapObservers();
  //   //   return true;
  //   // }

  //   // return false;
  // };

  clear() {
    this.next({
      type: ListMutationType.Clear,
    });
  }

  notifyMapObservers(obs: MapObserver<T, any>[] = this.mapObservers) {
    const items = this;
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
  project(items: List<T>): U;
};
