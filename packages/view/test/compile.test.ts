// import { expect, describe, it } from 'vitest';
// import { jsx } from '../jsx-runtime';
// import {
//   DomFactory,
//   compile,
//   HydrateOperationType,
//   Program,
//   StaticElementDescriptor,
//   DomDescriptorType,
// } from '../lib';

// function appendChild(this: any, child: any) {
//   if (this.children) this.children.push(child);
//   else this.children = [child];
// }

// function tag(name: string, attrs?: any, ...children: any[]) {
//   return {
//     name,
//     ...attrs,
//     children,
//     appendChild,
//   } as any;
// }

// // const testFactory: DomFactory = {
// //   createElement(name) {
// //     return tag(name);
// //   },
// // };

// function testCompile(...jsx) {
//   const p = compile(jsx);
//   if (p instanceof Promise) {
//     return p;
//   } else {
//     return Promise.resolve(p);
//   }
// }

// describe('compile', () => {
//   it('program', async () => {
//     const component = new Program([]);

//     return testCompile(component).then((program) => {
//       expect(program).toBe(component);
//     });
//   });

//   it('trivial', async () => {
//     const component = jsx('div');

//     return testCompile(component).then((program) => {
//       expect(program!.staticTemplate).toMatchObject([staticElement('div')]);
//     });
//   });

//   it('trivial merge', async () => {
//     const component = [jsx('div'), jsx('div')];
//     return testCompile(component).then((program) => {
//       expect(program).toMatchObject({
//         staticTemplate: [staticElement('div'), staticElement('div')],
//       });
//     });
//   });

//   it('trivial bind', async () => {
//     const component = [jsx('div', { children: jsx('div') })];
//     return testCompile(component).then((program) => {
//       expect(program).toMatchObject({
//         staticTemplate: [staticElement('div', null, staticElement('div'))],
//       });
//     });
//   });

//   it('trivial events', async () => {
//     const click = () => {};
//     const component = jsx('button', { click });

//     return testCompile(component).then((program) => {
//       expect(program).toMatchObject(
//         new Program([staticElement('button')], {
//           click: [
//             { handler: click, type: HydrateOperationType.ApplyEventHandler },
//           ],
//         })
//       );
//     });
//   });

//   it('inherited events', async () => {
//     const click = () => {};
//     const component = [div({}, button({ click }))];

//     return testCompile(component).then((program) => {
//       const expected = new Program(
//         [staticElement('div', null, staticElement('button'))],
//         {
//           click: [
//             { type: HydrateOperationType.PushChild, index: 0 },
//             { handler: click, type: HydrateOperationType.ApplyEventHandler },
//           ],
//         }
//       );

//       expect(program).toMatchObject(expected);
//     });
//   });

//   it('merge button with events', async () => {
//     const click = () => {};
//     const component = [div(null, button({ click })), button({ click })];

//     return testCompile(component).then((program) => {
//       const expected = new Program(
//         [
//           staticElement('div', null, staticElement('button')),
//           staticElement('button'),
//         ],
//         {
//           click: [
//             { type: HydrateOperationType.PushChild, index: 0 },
//             { handler: click, type: HydrateOperationType.ApplyEventHandler },
//             { type: HydrateOperationType.PopChild },
//             { type: HydrateOperationType.PushSibling, offset: 1 },
//             { handler: click, type: HydrateOperationType.ApplyEventHandler },
//           ],
//         }
//       );

//       expect(program!.staticTemplate).toMatchObject(expected.staticTemplate);
//       expect(program!.eventOperations).toMatchObject(expected.eventOperations!);
//     });
//   });

//   it('merge button with events 2', async () => {
//     const click = () => {};
//     const component = [div(null), div(null, button({ click }))];

//     return testCompile(component).then((program) => {
//       const expected = new Program(
//         [
//           staticElement('div'),
//           staticElement('div', null, staticElement('button')),
//         ],
//         {
//           click: [
//             { type: HydrateOperationType.PushSibling, offset: 1 },
//             { type: HydrateOperationType.PushChild, index: 0 },
//             { handler: click, type: HydrateOperationType.ApplyEventHandler },
//           ],
//         }
//       );

//       expect(program!.staticTemplate).toMatchObject(expected.staticTemplate);
//       expect(program!.eventOperations).toMatchObject(expected.eventOperations!);
//     });
//   });

//   it('associative merge events', async () => {
//     const click = () => {};
//     const a = div(null, button({ click }));
//     const b = div(null);
//     const c = div(null, button({ click }));
//     const program1 = await testCompile(testCompile(a, b), c);
//     const program2 = await testCompile(a, testCompile(b, c));

//     expect(program1?.staticTemplate).toMatchObject(program2!.staticTemplate);

//     expect(program1?.eventOperations).toMatchObject(program2!.eventOperations!);
//   });
// });

// function staticElement(
//   name: string,
//   attrs?: StaticElementDescriptor['attrs'] | null,
//   children?: StaticElementDescriptor['children']
// ): StaticElementDescriptor {
//   const obj: StaticElementDescriptor = {
//     type: DomDescriptorType.StaticElement,
//     name,
//   };

//   if (attrs) {
//     obj.attrs = attrs;
//   }
//   if (children) {
//     obj.children = children;
//   }

//   return obj;
// }

// function div(attrs: any, ...children: any[]) {
//   return jsx('div', children ? { ...attrs, children } : attrs);
// }

// function button(attrs: any, ...children: any[]) {
//   return jsx('button', children ? { ...attrs, children } : attrs);
// }
