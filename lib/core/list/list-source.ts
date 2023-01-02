import { NextObserver } from '../../jsx/observables';
import {
  ListClearMutation,
  ListDeleteMutation,
  ListMoveMutation,
  ListMutation,
  ListMutationType,
  ListUpdateMutation,
} from './mutation';

const _previous: unique symbol = Symbol();
const _included: unique symbol = Symbol();
const _index: unique symbol = Symbol('index');

export function createListSource<T extends {}>(initial?: T[]) {
  return new ListSource<T>(initial);
}

type ListObserver<T> = NextObserver<ListMutation<T>>;

type ListItem<T> = {
  [P in keyof T]: T[P];
} & { [_index]?: number; [_included]?: boolean };

interface List<out T> {
  [k: number]: T;
  length: number;
}

export class ListSource<T> {
  public readonly observers: ListObserver<T>[] = [];
  public readonly mapObservers: MapObserver<T, any>[] = [];

  constructor(public readonly snapshot: ListItem<T>[] = []) {
    let length = snapshot.length;
    while (length--) {
      const item = snapshot[length];
      item[_index] = length;
    }
  }

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
    const { snapshot } = this;
    const length = snapshot.length;
    switch (mut.type) {
      case ListMutationType.Clear:
        snapshot.length = 0;
        break;
      case ListMutationType.Push:
        const item = mut.item as ListItem<T>;
        if (item) {
          item[_index] = length;
          snapshot[length] = item;
        } else {
          snapshot[length] = { [_index]: length } as ListItem<T>;
        }
        snapshot.length = length + 1;
        break;
      case ListMutationType.Concat:
        const offset = snapshot.length;
        for (let i = 0, n = offset, len = mut.items.length; i < len; i++, n++) {
          const item = mut.items[i] as ListItem<T>;
          if (item) {
            item[_index] = n;
            snapshot[n] = item;
          } else {
            snapshot[n] = { [_index]: length } as ListItem<T>;
          }
        }
        snapshot.length = length + mut.items.length;
        break;
      case ListMutationType.DeleteAt:
        for (let i = mut.index, len = length - 1; i < len; i++) {
          const next = snapshot[i + 1];
          snapshot[i] = next;
          next[_index] = i;
        }
        snapshot.length = length - 1;
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

    this.notifyMapObservers();
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

  move(itemIdx: number, beforeItemIdx: number) {
    if (itemIdx === beforeItemIdx || itemIdx + 1 === beforeItemIdx) return;
    const { snapshot } = this;
    const itemToMove = snapshot[itemIdx];
    const beforeItem = snapshot[beforeItemIdx];

    if (itemIdx < beforeItemIdx) {
      const toIndex = beforeItemIdx - 1;
      for (let i = itemIdx; i < toIndex; i++) {
        snapshot[i] = snapshot[i + 1];
        snapshot[i][_index] = i;
      }
      snapshot[toIndex] = itemToMove;
      itemToMove[_index] = toIndex;
    } else {
      const toIndex = beforeItemIdx;
      for (let i = itemIdx; i > toIndex; i--) {
        snapshot[i] = snapshot[i - 1];
        snapshot[i][_index] = i;
      }
      snapshot[toIndex] = itemToMove;
      itemToMove[_index] = toIndex;
    }

    const mut: ListMoveMutation<T> = {
      type: ListMutationType.Move,
      item: itemToMove,
      beforeItem,
    };

    const { observers } = this;
    let olen = observers.length;
    while (olen--) {
      const o = observers[olen];
      o.next(mut);
    }

    this.notifyMapObservers();
  }

  update = (updater?: (data: List<T>) => ArrayLike<T> | void) => {
    if (updater instanceof Function) {
      const updated = updater(this.snapshot);

      const mut: ListUpdateMutation<T> = {
        type: ListMutationType.Update,
        items: updated instanceof Array ? updated : this.snapshot,
      };

      const { observers } = this;
      let olen = observers.length;
      while (olen--) {
        const o = observers[olen];
        o.next(mut);
      }

      this.notifyMapObservers();
    }

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
    const { snapshot } = this;
    for (let i = 0, len = snapshot.length; i < len; i++) {
      const x = snapshot[i];
      // const included = x[_included] ?? true;
      if (x === item) {
        for (let n = i; n < len - 1; n++) {
          const next = snapshot[n + 1];
          snapshot[n] = next;
          next[_index] = i;
        }
        snapshot.length = snapshot.length - 1;

        // if (included) {
        const mut: ListDeleteMutation<T> = {
          type: ListMutationType.Delete,
          item,
        };

        const { observers } = this;
        let olen = observers.length;
        while (olen--) {
          const o = observers[olen];
          o.next(mut);
        }
        // }
        break;
      }
    }

    this.notifyMapObservers();
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
    const { snapshot } = this;
    if (snapshot.length > 0) {
      const mut: ListClearMutation<T> = {
        type: ListMutationType.Clear,
        firstItem: snapshot[0],
        lastItem: snapshot[snapshot.length - 1],
      };

      snapshot.length = 0;

      const { observers } = this;
      let olen = observers.length;
      while (olen--) {
        const o = observers[olen];
        o.next(mut);
      }

      this.notifyMapObservers();
    }
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
      subscribe(o: NextObserver<U>) {
        (o as any)['project'] = project;
        listSource.mapObservers.push(o as any);
        listSource.notifyMapObservers([o as any]);

        return {
          unsubscribe() {
            const { mapObservers } = listSource;
            const idx = mapObservers.indexOf(o as any);
            if (idx >= 0) {
              mapObservers.splice(idx, 1);
            }
          },
        };
      },
      ssr() {
        return {
          // type: ExpressionType.Call,
          func: 'map',
          source: listSource.snapshot,
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

type MapObserver<T, U> = NextObserver<T[]> & {
  project(items: List<T>): U;
};
