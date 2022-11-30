// import { Subscribable } from 'rxjs';
// import { Disposable } from '../disposable';
// import { Renderable, RenderTarget } from '../jsx';

// export interface IfProps {
//   condition: Subscribable<boolean>;
// }

// export function If<T>(props: IfProps, children: Renderable<T>[]) {
//   return {
//     render(target: RenderTarget) {
//       const { condition } = props;
//       let bindings: Disposable[];
//       var sub = condition.subscribe({
//         next(b) {
//           if (b) {
//             bindings = children.map((x) => x.render(target));
//           } else {
//             bindings.map((x) => x.dispose());
//           }
//         },
//       });

//       return {
//         dispose() {
//           sub.unsubscribe();
//           bindings.map((x) => x.dispose());
//         },
//       };
//     },
//   };
// }
