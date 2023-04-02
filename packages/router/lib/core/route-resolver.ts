import { Path } from './path';
import { compilePathTemplate, PathTemplate } from './path-template';
import { RouteContext } from './router-context';

export function createRouteResolver<TView>(
  routes: RouteResolver<TView> | RouteMapInput<TView>[] | undefined
): RouteResolver<TView> {
  if (routes instanceof Function) {
    return routes;
  }
  const compiled = compile(routes);
  if (isArrayEmpty(compiled)) {
    return () => {
      return Promise.resolve<RouteResolution<TView> | null>(null);
    };
  }

  return resolver;

  function resolver(path: Path): Promise<RouteResolution<TView> | null> {
    for (const route of compiled) {
      const segment = route.match(path);
      if (segment) {
        if (segment instanceof Promise) {
          return segment.then(buildResolution);
        } else {
          return buildResolution(segment);
        }

        async function buildResolution(segment: RouteSegment) {
          const appliedPath = path.slice(0, segment.length);

          // const { view, routes } = await applyComponent(route.component, {
          //   params: segment.params,
          //   appliedPath,
          //   route
          // });

          return {
            appliedPath,
            component: route.component,
            params: segment.params,
            resolver: resolver,
            // resolve:
            //   routes instanceof Function ? routes : createViewResolver(routes),
          } satisfies RouteResolution<TView>;
        }
      }
    }
    return Promise.resolve(null);
  }

  function compile(
    routes: RouteMapInput<TView>[] | undefined
  ): RouteMap<TView>[] {
    const results: RouteMap<TView>[] = [];
    if (routes instanceof Array) {
      for (const route of routes) {
        const { path, component } = route;

        results.push({
          match:
            path instanceof Function
              ? path
              : pathMatcher(path instanceof Array ? path : path.split('/')),
          component,
        });
      }
    }
    return results;
  }
}

export function pathMatcher(pathTemplate: PathTemplate) {
  const matchers = compilePathTemplate(pathTemplate);
  return (path: Path) => {
    const params = {};
    let applied = 0;
    for (let i = 0, len = matchers.length; i < len; i++) {
      const matcher = matchers[i];
      const match = matcher(path, applied);
      if (match === false) return null;
      const { length, ...rest } = match;
      applied += length;
      Object.assign(params, rest);
    }
    return { length: applied, params } as RouteSegment;
  };
}

interface RouteParams {
  [key: string]: any;
}

interface RouteSegment {
  length: number;
  params?: RouteParams;
}

export type RouteResolver<TView = any> = (
  route: string[]
) => Promise<RouteResolution<TView> | null>;

export interface RouteResolution<TView = any> {
  appliedPath: string[];
  params?: RouteParams;
  resolver?: RouteResolver<TView>;
  component: RouteComponentInput<TView> | null;
}

export interface RouteMap<TView> {
  match(path: Path): RouteSegment | Promise<RouteSegment> | null;
  component: RouteComponentInput<TView>;
}

function isArrayEmpty(arr: any[]) {
  return !(arr instanceof Array) || arr.length === 0;
}

// function memoize<TF extends (...args: any[]) => any>(fn: TF) {
//   let result = null;
//   let invoked = false;
//   return function (...args: Parameters<TF>): ReturnType<TF> {
//     if (invoked) {
//       return result;
//     }
//     invoked = true;
//     return (result = fn());
//   };
// }

export type RouteComponentInput<TView = any> = TView;

export interface RouteMapInput<TView = any> {
  path: RouteMap<TView>['match'] | Path | string;
  component: RouteComponentInput<TView>;
}
