import { State } from '../../state';

enum ArrayMutationType {
  Move,
  Insert,
  Concat,
  Truncate,
  RemoveAt,
}

interface MoveMutation<T> {
  type: ArrayMutationType.Move;
  value: T;
  from: number;
  to: number;
}

interface InsertMutation<T> {
  type: ArrayMutationType.Insert;
  value: T;
  index: number;
}

interface PushMutation<T> {
  type: ArrayMutationType.Concat;
  values: T[];
}

interface TruncateMutation {
  type: ArrayMutationType.Truncate;
  length: number;
}

interface RemoveAtMutation {
  type: ArrayMutationType.RemoveAt;
  index: number;
}

type ArrayMutation<T> =
  | MoveMutation<T>
  | PushMutation<T>
  | InsertMutation<T>
  | RemoveAtMutation
  | TruncateMutation;

export function reconcile<T>(innerArr: State<T>[], newArr: T[]) {
  let innerLen = innerArr.length;
  let newLen = newArr.length;

  const mutations: ArrayMutation<T>[] = [];

  let aIdx = 0;
  let bIdx = 0;

  while (aIdx < newLen && bIdx < innerLen) {
    const a = newArr[aIdx];
    const b = innerArr[bIdx];
    if (a === b.snapshot) {
      aIdx++;
      bIdx++;
    } else {
      let bNewIdx: number | undefined = undefined;
      for (let i = bIdx + 1; i < newLen; i++) {
        if (newArr[i] === b.snapshot) {
          bNewIdx = i;
          break;
        }
      }
      if (bNewIdx === undefined) {
        innerArr.splice(bIdx, 1);
        mutations.push({
          type: ArrayMutationType.RemoveAt,
          index: bIdx,
        });
      } else {
        let aOldIdx: number | undefined = undefined;
        for (let i = aIdx + 1; i < innerLen; i++) {
          if (innerArr[i].snapshot === a) {
            aOldIdx = i;
            break;
          }
        }

        if (aOldIdx === undefined) {
          innerArr.splice(aIdx, 0, new State(a));
          mutations.push({
            type: ArrayMutationType.Insert,
            value: a,
            index: aIdx,
          });
          aIdx++;
          bIdx++;
        } else if (aOldIdx !== aIdx) {
          const tmp = innerArr[aOldIdx];
          innerArr[aOldIdx] = innerArr[aIdx];
          innerArr[aIdx] = tmp;

          mutations.push({
            type: ArrayMutationType.Move,
            value: a,
            from: aOldIdx,
            to: aIdx,
          });
          aIdx++;
          bIdx++;
        }
      }
    }
  }

  if (aIdx < newLen) {
    mutations.push({
      type: ArrayMutationType.Concat,
      values: newArr.slice(aIdx),
    });
    for (let i = aIdx; i < newLen; i++) {
      innerArr.push(new State(newArr[i]));
    }
  } else if (bIdx < innerLen) {
    mutations.push({
      type: ArrayMutationType.Truncate,
      length: bIdx,
    });
    innerArr.length = bIdx;
  }

  innerLen = newLen;

  return mutations;
}

export function patch<T>(arr: T[], mut: ArrayMutation<T>) {
  switch (mut.type) {
    case ArrayMutationType.Insert:
      arr.splice(mut.index, 0, mut.value);
      break;
    case ArrayMutationType.Move:
      const tmp = arr[mut.from];
      arr[mut.from] = arr[mut.to];
      arr[mut.to] = tmp;
      break;
    case ArrayMutationType.Concat:
      for (const v of mut.values) {
        arr.push(v);
      }
      break;
    case ArrayMutationType.Truncate:
      arr.length = mut.length;
      break;
    case ArrayMutationType.RemoveAt:
      arr.splice(mut.index, 1);
      break;
  }
}
