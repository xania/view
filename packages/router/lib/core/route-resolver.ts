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

  function compile(routes: RouteMapInput<TView>[] | undefined): Route<TView>[] {
    const results: Route<TView>[] = [];
    if (routes instanceof Array) {
      for (const route of routes) {
        const { match, component } = route;

        results.push({
          match: match instanceof Function ? match : pathMatcher(match),
          component,
        });
      }
    }
    return results;
  }
}

function pathMatcher(pathTemplate: PathTemplate) {
  const matchers = compilePathTemplate(pathTemplate);
  return (path: Path) => {
    const { length } = pathTemplate;
    if ((length === 0 && path.length > 0) || length > path.length) {
      return null;
    }
    const params = {};
    for (var i = 0; i < length; i++) {
      const match = matchers[i](path[i]);
      if (!match) {
        return null;
      } else if (match !== true) {
        Object.assign(params, match);
      }
    }
    return {
      length: length,
      params,
    } as RouteSegment;
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
  resolver: RouteResolver<TView>;
  component: RouteComponentInput<TView> | null;
}

interface Route<TView> {
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

export type RouteComponentInput<TView = any> =
  | TView
  | ((context: RouteContext) => TView);

export interface RouteMapInput<TView = any> {
  match: Route<TView>['match'] | Path;
  component: RouteComponentInput<TView>;
}

export function routeMap<TView>(
  match: RouteMapInput<TView>['match'],
  component: RouteMapInput<TView>['component']
): RouteMapInput<TView> {
  return {
    match,
    component,
  };
}
