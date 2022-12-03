import { State } from '../../state';
import { ListMutation, ListMutationType } from './mutation';

export function reconcile<T>(
  innerArr: State<T>[],
  newArr: T[] | void
): ListMutation<State<T>>[] {
  if (!newArr)return[];
  console.warn('reconcile is buggy, use it if you intent to fix it');
  let innerLen = innerArr.length;
  let newLen = newArr.length;

  const mutations: ListMutation<State<T>>[] = [];

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
          type: ListMutationType.DeleteAt,
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
            type: ListMutationType.Insert,
            item: new State(a),
            index: aIdx,
          });
          aIdx++;
          bIdx++;
        } else if (aOldIdx !== aIdx) {
          const tmp = innerArr[aOldIdx];
          innerArr[aOldIdx] = innerArr[aIdx];
          innerArr[aIdx] = tmp;

          mutations.push({
            type: ListMutationType.Move,
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
      type: ListMutationType.Concat,
      values: newArr.slice(aIdx).map((e) => new State(e)),
    });
    for (let i = aIdx; i < newLen; i++) {
      innerArr.push(new State(newArr[i]));
    }
  } else if (bIdx < innerLen) {
    mutations.push({
      type: ListMutationType.Truncate,
      length: bIdx,
    });
    innerArr.length = bIdx;
  }

  innerLen = newLen;

  return mutations;
}

// export function patch<T>(arr: T[], mut: ListMutation<T>) {
//   switch (mut.type) {
//     case ListMutationType.Insert:
//       arr.splice(mut.index, 0, mut.value);
//       break;
//     case ListMutationType.Move:
//       const tmp = arr[mut.from];
//       arr[mut.from] = arr[mut.to];
//       arr[mut.to] = tmp;
//       break;
//     case ArrayMutationType.Concat:
//       for (const v of mut.values) {
//         arr.push(v);
//       }
//       break;
//     case ArrayMutationType.Truncate:
//       arr.length = mut.length;
//       break;
//     case ArrayMutationType.RemoveAt:
//       arr.splice(mut.index, 1);
//       break;
//   }
// }
