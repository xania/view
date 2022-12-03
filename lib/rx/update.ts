// export function digest(root: DirtyItem[]) {
//   type Dependency = { list: LinkedList<DirtyItem> };
//   type StackItem = [DirtyItem, Dependency];
//   const stack: StackItem[] = [];
//   const dirty: { value?: any; observers: JSX.NextObserver<any>[] }[] = [];

//   const rootDep: Dependency = { list: null };
//   for (const r of root) stack.push([r, rootDep]);

//   while (stack.length) {
//     let [state, parentdependency] = stack.pop() as StackItem;

//     const newValue = state.snapshot;
//     const oldValue = state[_previous];
//     let currdep: Dependency = { list: null };
//     if (newValue !== oldValue) {
//       state[_previous] = newValue;
//       if (state.observers && state.observers.length) {
//         for (const o of state.observers as any) {
//           o[_previous] = newValue;
//           dirty.push(o);
//         }
//       }
//       let list = parentdependency.list;
//       while (list) {
//         for (const o of list.head.observers as any) {
//           o[_previous] = newValue;
//           dirty.push(o);
//         }
//         list = list.tail;
//       }
//       parentdependency.list = null;
//     } else {
//       currdep.list = { head: state, tail: parentdependency.list };

//       if (state.observers && state.observers.length) {
//         for (const o of state.observers as any) {
//           if (o[_previous] !== newValue) {
//             o[_previous] = newValue;
//             dirty.push(o);
//           }
//         }
//       }
//     }

//     const { properties } = state;
//     if (properties) {
//       let length = properties.length;
//       if (newValue === null || newValue === undefined) {
//         while (length--) {
//           const p = properties[length];
//           p.snapshot = null;
//           stack.push([p, currdep]);
//         }
//       } else
//         while (length--) {
//           const p = properties[length];
//           if (p instanceof StateProperty) {
//             p.snapshot = newValue[p.name];
//           } else if (p instanceof StateMap) {
//             p.snapshot = p.project(newValue);
//           }
//           stack.push([p, currdep]);
//         }
//     }
//   }

//   return dirty;
// }
