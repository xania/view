// import { describe, expect, it, vi } from 'vitest';
// import { Template, templateBind } from '../lib/tpl';

// describe('tpl', () => {
//   it('bind', () => {
//     const jsx: Template<number> = [1];
//     const retval = templateBind<number, number>(jsx, (x) => x + 1);
//     expect(retval).toEqual([2]);
//   });

//   it('bind promise', async () => {
//     const jsx: Template<number> = [1, Promise.resolve(3)];
//     const promise: Template<number> = templateBind(jsx, (x) => x + 1);
//     expect(promise).toBeInstanceOf(Promise);

//     if (promise instanceof Promise) {
//       return promise.then((retval) => {
//         expect(retval).toEqual([2, 4]);
//       });
//     }
//   });

//   it('bind nested array', async () => {
//     const jsx: Template<number> = [1, [[2]]];
//     const retval = templateBind(jsx, (x) => x + 1);

//     expect(retval).toMatchObject([2, 3]);
//   });

//   it('bind nested array', async () => {
//     const jsx: Template<number> = [1, [[2]]];
//     const retval = templateBind(jsx, (x) => Promise.resolve(x + 1)) as Promise<
//       number[]
//     >;

//     return retval.then((retval) => {
//       expect(retval).toMatchObject([2, 3]);
//     });
//   });
// });
