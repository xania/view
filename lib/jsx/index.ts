// import { reverse } from './reverse';

export * from './create-element';
export * from './use-context';
export * from './template';
export * from './expression';
export * from './renderable';
export * from './view';

// function flatTree<T = any>(tree: any, project?: (item: any) => T | T[]) {
//   var retval: T[] = [];
//   var stack = [tree];
//   while (stack.length > 0) {
//     var curr = stack.pop();
//     if (curr instanceof Array) {
//       stack.push.apply(stack, reverse(curr));
//     } else if (curr !== null && curr !== undefined) {
//       const projected = project ? project(curr) : curr;
//       if (projected instanceof Array) {
//         retval.push.apply(retval, projected);
//       } else if (projected !== undefined && projected !== null) {
//         retval.push(projected);
//       }
//     }
//   }
//   return retval;
// }

// function hasProperty<P extends string>(
//   obj: any,
//   prop: P
// ): obj is { [K in P]: any } {
//   return typeof obj === 'object' && obj !== null && prop in obj;
// }

// function isComponent(value: any): value is Component {
//   return value && typeof value.view === 'function';
// }

// function isAttachable(value: any): value is Attachable {
//   return value && typeof value.attachTo === 'function';
// }

// function isPromise<T = unknown>(value: any): value is Promise<T> {
//   return value && typeof value.then === 'function';
// }

// function functionAsTemplate(func: Function): ITemplate {
//   return {
//     render(driver: IDriver, ...args) {
//       const tpl = func(...args);
//       var template = asTemplate(tpl);
//       if (Array.isArray(template)) {
//         const bindings: Binding[] = [];
//         for (let i = 0; i < template.length; i++) {
//           const b = template[i].render(driver);
//           if (b) {
//             bindings.push();
//           }
//         }
//         return {
//           dispose() {
//             for (let i = 0; i < bindings.length; i++) {
//               const binding = bindings[i];
//               if (binding.dispose) {
//                 binding.dispose();
//               }
//             }
//           },
//         };
//       } else {
//         return template.render(driver);
//       }
//     },
//   };
// }

// export function createFunctionRenderer(func: Function): RenderableTemplate {
//   return {
//     type: TemplateType.Renderable,
//     renderer: {
//       render(driver: any, context: RenderContext) {
//         const templates = flatTree(func.apply(null, [context]), asTemplate);
//         return compile(templates).render(driver.target, undefined);
//       },
//     },
//   };
// }
