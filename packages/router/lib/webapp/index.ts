import { Path } from '../core';
import { RouteMapInput } from '../core';

// import boxes from './animations/boxes';
import { createBrowser } from '../browser-router';
import { CssClasses } from './page';

import webapp from './webapp.module.scss';
import { Router } from '../child-router';

// const routeEnd = Symbol('end');

export interface WebAppProps<TView> {
  routeMaps: RouteMapInput<TView>[];
}

export function WebApp<TView>(props: WebAppProps<TView>) {
  const { routeMaps } = props;

  return Router({
    context: {
      path: [],
      fullpath: [],
      routes: createBrowser([]).routes,
    },
    routeMaps,
  });
}

//   const rootResolve = createRouteResolver(routeMaps);

//   return {
//     attachTo(target: HTMLElement) {
//       if (theme.outlet) target.classList.add(theme.outlet);

//       const outletRoot = document.createElement('div');
//       // const rootPageContext = {
//       //   path: [],
//       //   fullpath: [],
//       //   resolvePath: rootResolve,
//       //   router,
//       // };

//       const viewCache: [
//         RouteResolution<TView>,
//         (TView | RouteError)[],
//         Tree<Disposable>
//       ][] = [];

//       function applyComponent<TView>(
//         component: RouteComponentInput<TView>,
//         context: RouteContext
//       ): Tree<TView | RouteError> {
//         try {
//           return component instanceof Function ? component(context) : component;
//         } catch (err) {
//           return new RouteError(err);
//         }
//       }

//       return (
//         router.routes
//           // .pipe(distinct('path'))
//           .bind((route) => {
//             const disposeLoader = createLoader(target);

//             if (theme['outlet__root--collapsed'])
//               if (route.path.length > 0) {
//                 outletRoot.classList.add(theme['outlet__root--collapsed']);
//               } else {
//                 outletRoot.classList.remove(theme['outlet__root--collapsed']);
//               }

//             type OutputItem =
//               | [number, TView | RouteError | any, RouteResolution<TView>]
//               | [number, typeof routeEnd];
//             const output = new State<OutputItem>();

//             function applyResolution(
//               resolution: RouteResolution<TView> | null,
//               index: number
//             ): number | Promise<number> {
//               if (!resolution) {
//                 return index;
//               }

//               const cacheEntry = viewCache[index];

//               if (
//                 cacheEntry &&
//                 matchPath(cacheEntry[0].appliedPath, resolution.appliedPath)
//               ) {
//                 return index + 1;
//               }

//               const result = applyComponent(resolution.component, {
//                 fullpath: resolution.appliedPath,
//                 path: resolution.appliedPath,
//                 router: router,
//               });
//               output.set([index, result, resolution]);
//               return index + 1;
//             }

//             rootResolve(route.path).then(async (resolution) => {
//               const index = await applyResolution(resolution, 0);
//               output.set([index, routeEnd]);
//               disposeLoader();
//             });

//             // traverse(rootPageContext, route.path, (p: Page<TView>) =>
//             //   page.set(p)
//             // ).then(() => {
//             // });
//             return output;
//           })
//           .subscribe({
//             next([index, view, resolution]) {
//               // const entry = viewCache[index];
//               // if (entry) {
//               //   if (
//               //     resolution &&
//               //     matchPath(entry[0].appliedPath, resolution.appliedPath)
//               //   ) {
//               //     entry[1].push(view);
//               //   }
//               //     return;
//               //   disposeAll(entry[2]);
//               // }

//               if (view === routeEnd) {
//                 for (let i = index; i < viewCache.length; i++) {
//                   disposeAll(viewCache[i][2]);
//                 }
//                 viewCache.length = index;
//               } else {
//                 const entry = viewCache[index];
//                 if (
//                   entry &&
//                   matchPath(entry[0].appliedPath, resolution!.appliedPath)
//                 ) {
//                   entry[1].push(view);
//                   entry[2] = [entry[2], props.render(view)];
//                 } else {
//                   if (entry) {
//                     disposeAll(entry[2]);
//                   }
//                   viewCache[index] = [resolution!, [view], props.render(view)];
//                 }
//               }
//             },
//           })
//       );
//       // .subscribe({
//       //   next(page) {
//       //     const { parent } = page;
//       //     if (parent.next) {
//       //       disposeNext(parent);
//       //     }
//       //     parent.next = page;

//       //     if (page.view !== null) {
//       //       page.renderResult = props.renderPage(page.view);
//       //     }
//       //   },
//       // });
//     },
//   };
// }

// function traverse<TView>(
//   parent: PageContext<TView>,
//   childPath: Path,
//   report: (p: Page<TView>) => void
// ): Promise<void> {
//   function traverseNext(
//     next: PageContext<TView>,
//     routeResolution: RouteResolution
//   ) {
//     const remaining = childPath.slice(routeResolution.appliedPath.length);

//     // if (routeResolution.appliedPath.length === 0)
//     //   return new PageEnd(parent, remaining);

//     return traverse(next, remaining, report);
//   }

//   return parent.resolvePath(childPath).then(async (childResolution) => {
//     if (childResolution) {
//       if (parent.next) {
//         const { path } = parent.next;

//         if (matchPath(childResolution.appliedPath, parent.next.path)) {
//           return traverseNext(parent.next, childResolution);
//         }
//       }

//       const view = await applyComponent(
//         childResolution.component,
//         new PageRouteContext(parent, childResolution)
//       );

//       const child = new Page(
//         childResolution.appliedPath,
//         {},
//         createRouteResolver(routes),
//         parent,
//         view
//       );
//       report(child);

//       return traverseNext(child, childResolution);
//     } else {
//       report(
//         new Page<TView>(
//           childPath,
//           {},
//           () => Promise.resolve(null),
//           parent,
//           null
//         )
//       );
//     }
//   });
// }

// class PageRouteContext implements RouteContext {
//   constructor(
//     public parent: PageContext<any>,
//     public routeResolution: RouteResolution,
//     public router = parent.router
//   ) {}

//   get params() {
//     // params: parentParams
//     // ? { ...parentParams, ...routeResolution.params }
//     // : routeResolution.params,
//     return {};
//   }

//   get fullpath() {
//     return this.parent.fullpath.concat(this.routeResolution.appliedPath);
//     // : `${this.basePath
//     //   .map((e) => "/" + e)
//     //   .join("")}/${routeResolution.appliedPath.join("/")}`,
//   }
// }

// class Page<TView> implements PageContext<TView> {
//   renderResult?: Tree<Disposable>;

//   constructor(
//     public path: string[],
//     public params: Record<string, any>,
//     public resolvePath: RouteResolver,
//     public parent: PageContext<TView>,
//     public view: TView | null
//   ) {}

//   next?: Page<TView> | undefined;
//   get fullpath(): Path {
//     throw new Error('Method not implemented.');
//   }

//   get router() {
//     return this.parent.router;
//   }
// }

// interface PageContext<TView = any> extends RouteContext {
//   path: Path;
//   next?: Page<TView>;
//   resolvePath: RouteResolver<TView>;
// }

// function createLoader(target: HTMLElement) {
//   const animation = boxes();
//   const loader = document.createElement('div');

//   loader.className = webapp.loading;

//   loader.appendChild(animation);
//   target.appendChild(loader);

//   return function () {
//     setTimeout(() => loader.remove(), 200);
//   };
// }
// function disposeNext(parent: PageContext) {
//   while (parent.next) {
//     disposeAll(parent.next.renderResult);
//     parent.next.renderResult = undefined;
//     parent = parent.next;
//   }
// }

function matchPath(x: Path, y: Path) {
  if (x.length === 0) return true;

  for (let i = 0; i < x.length; i++) {
    if (y[i] !== x[i]) return false;
  }

  return true;
}

// class PageEnd {
//   constructor(public parent: PageContext, public remaingPath: Path) {}
// }

class RouteError {
  constructor(public err: any) {}
}

function startsWith(path: Path, prefix: Path) {
  if (prefix.length > path.length) return false;

  for (let i = 0; i < prefix.length; i++) {
    if (prefix[i] !== path[i]) return false;
  }

  return true;
}

class PathCache<T = any> {
  entries: { path: Path; index: number; value: T }[] = [];
  get(index: number, path: Path) {
    const { entries } = this;
    for (const entry of entries) {
      if (entry.index === index && matchPath(entry.path, path)) {
        return entry.value;
      }
    }
    return undefined;
  }

  set(index: number, path: Path, value: T) {
    const { entries } = this;
    entries.push({ index, path, value });
  }
}
