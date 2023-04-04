// export function treduce<T>(
//   template: JSX.Template<T>,
//   reducer: (x: T, y: T) => T
// ): JSX.MaybePromise<T | null> {
//   let acc: T | null = null;
//   const stack: JSX.Template<T>[] = [];

//   function traverse(initial: JSX.Template<T>): JSX.MaybePromise<T | null> {
//     if (initial !== null && initial !== undefined) {
//       stack.push(initial);
//     }

//     while (stack.length) {
//       const curr = stack.pop()!;
//       if (curr instanceof Array) {
//         for (let i = curr.length - 1; i >= 0; i--) {
//           if (curr[i] !== null && curr[i] !== undefined) stack.push(curr[i]);
//         }
//       } else if (curr instanceof Promise) {
//         return curr.then(traverse);
//       } else if (curr instanceof Function) {
//         stack.push(curr());
//       } else if (curr !== null && curr !== undefined) {
//         if (acc === null) {
//           acc = curr;
//         } else {
//           acc = reducer(curr, acc);
//         }
//       }
//     }

//     return acc;
//   }

//   return traverse(template);
// }
