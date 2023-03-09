import { Path } from './path';
import { compilePathTemplate, PathTemplate } from './path-template';
import { RouteContext } from './router-context';

export function createRouteResolver<TView>(
  routes: RouteResolver<TView> | RouteInput<TView>[] | undefined
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

  return resolve;

  function resolve(remainingPath: string[]) {
    for (const route of compiled) {
      const segment = route.match(remainingPath);
      if (segment) {
        if (segment instanceof Promise) {
          return segment.then(buildResolution);
        } else {
          return buildResolution(segment);
        }

        async function buildResolution(segment: RouteSegment) {
          const appliedPath = remainingPath.slice(0, segment.length);

          // const { view, routes } = await applyComponent(route.component, {
          //   params: segment.params,
          //   appliedPath,
          //   route
          // });

          return {
            appliedPath,
            component: route.component,
            params: segment.params,
            // resolve:
            //   routes instanceof Function ? routes : createViewResolver(routes),
          } as RouteResolution<TView>;
        }
      }
    }
    return Promise.resolve(null);
  }

  function compile(routes: RouteInput<TView>[] | undefined): Route<TView>[] {
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
  component: RouteComponentInput<TView> | null;
}

export interface RouteInput<TView> {
  match: Route<TView>['match'] | string[];
  component: RouteComponentInput<TView>;
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

export interface RouteComponent<TView = any> {
  view: TView;
  routes?: RouteInput<TView>[] | RouteResolver<TView>;
}

export type RouteComponentInput<TView = any> =
  | TView
  | ((context: RouteContext) => RouteComponent<TView>);

export function route<TView>(
  match: RouteInput<TView>['match'],
  component: RouteInput<TView>['component']
): RouteInput<TView> {
  return {
    match,
    component,
  };
}
