import { Each } from './each';
import { Scope } from './program';

const itemKey = Symbol();
const __indexKey = Symbol();

export function changes<T>(
  node: Each<T>,
  source: T[],
  listDiff: ListChanges
): Mutation<T>[] | void {
  const { scopes, mutations } = listDiff;
  mutations.length = 0;

  if (scopes.length === 0) {
    mutations.push({ items: source, type: MutationType.Append });

    for (let i = 0, len = source.length; i < len; i++) {
      const item = source[i];
      const itemScope = node.factory(item);
      setIndex(itemScope, item, i);
      itemScope[itemKey] = item;
      scopes.push(itemScope);
      node.body.reconcile(itemScope, 0);
    }
  } else {
    // for (let i = 0, len = scopes.length; i < len; i++) {
    //   const scope = scopes[i];
    //   const item = scope[itemKey];
    //   flagIndex(scope, item);
    // }

    const removed: number[] = [];
    for (let i = 0, len = scopes.length; i < len; i++) {
      const scope = scopes[i];
      const item = scope[itemKey];

      if (!source.includes(item)) {
        const index = getIndex(scope, item);
        removed.push(index);
      }
    }

    if (removed.length) {
      mutations.push({
        type: MutationType.Remove,
        indices: removed,
      });
    }

    for (let i = 0, len = source.length; i < len; i++) {
      const item = source[i];
      const scope = scopes.find((x) => x[itemKey] === item);
      if (scope) {
        const prevIndex = getIndex(scope, item);
        const adjustedIndex = adjustIndex(mutations, prevIndex);

        setIndex(scope, item, i);
        if (adjustedIndex !== i) {
          setIndex(scope, item, i);
          mutations.push({
            type: MutationType.Move,
            from: adjustedIndex,
            to: i,
          });
        }
      } else {
        const itemScope = node.factory(item);
        setIndex(itemScope, item, i);
        itemScope[itemKey] = item;
        scopes.push(itemScope);
        mutations.push({ type: MutationType.Insert, index: i, item });
      }
    }
  }
}

export type Mutation<T> =
  | AppendMutation<T>
  | MoveMutation
  | InsertMutation<T>
  | RemoveMutation;

export interface AppendMutation<T = any> {
  type: MutationType.Append;
  items: T[];
}

export interface MoveMutation {
  type: MutationType.Move;
  from: number;
  to: number;
}

export interface InsertMutation<T> {
  type: MutationType.Insert;
  item: T;
  index: number;
}

export interface RemoveMutation {
  type: MutationType.Remove;
  indices: number[];
}

export enum MutationType {
  Append,
  Move,
  Insert,
  Remove,
}

export class ListChanges {
  constructor(public scopes: Scope[], public mutations: Mutation<any>[]) {}
}

function adjustIndex(mutations: ListChanges['mutations'], index: number) {
  for (const m of mutations) {
    switch (m.type) {
      case MutationType.Insert:
        if (m.index <= index) {
          index++;
        }
        break;
      case MutationType.Move:
        if (m.from > index && m.to <= index) {
          index++;
        }
        break;
      case MutationType.Remove:
        let count = 0;
        for (const i of m.indices) {
          if (i < index) {
            count++;
          }
        }
        index -= count;
        break;
    }
  }
  return index;
}
function getIndex(scope: Scope, item: any): number {
  const constructor = item.constructor;
  if (
    constructor === Number ||
    constructor === String ||
    constructor === Symbol
  ) {
    return scope[item];
  } else {
    return item[__indexKey];
  }
}

function setIndex(scope: Scope, item: any, index: number) {
  const constructor = item.constructor;
  if (
    constructor === Number ||
    constructor === String ||
    constructor === Symbol
  ) {
    scope[item] = index;
  } else {
    item[__indexKey] = index;
  }
}

function flagIndex(scope: Scope, item: any) {
  const constructor = item.constructor;
  if (
    constructor === Number ||
    constructor === String ||
    constructor === Symbol
  ) {
    const index = scope[item] | 0;
    scope[item] = -index - 1;
  } else {
    const index = scope[__indexKey] | 0;
    item[__indexKey] = -index - 1;
  }
}
