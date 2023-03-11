import { filter, Rx, State, Value } from '@xania/state';
import {
  createRouteResolver,
  Path,
  Route,
  RouteContext,
  RouteMapInput,
  RouteResolver,
} from '../core';

export class ChildRouter<TView> {
  constructor(
    public routes: Value<Route>,
    public resolve: RouteResolver<TView>
  ) {}
  // constructor(
  //   public props: any,
  //   // public readonly routeMap: RouteMapInput<TView>[]
  // ) // public readonly resolve: ViewResolver<TView>
  // {}

  view() {
    const childRouter = this;
    const { routes } = this;
    return routes.bind(async (r: Route) => {
      const resolution = await childRouter.resolve(r.path);
      if (resolution && resolution.component) {
        const { component } = resolution;
        if (component instanceof Function) {
          return component({ fullpath: [], router: childRouter });
        }
      }
    });
  }
}

export function childRouter<TView>(
  context: RouteContext,
  routeMaps: RouteMapInput<TView>[]
) {
  const childRoutes = context.router.routes.pipe(relativeTo(context.fullpath));
  return new ChildRouter(childRoutes, createRouteResolver(routeMaps));
  // return new ChildRouter(childRoutes, );
}

function relativeTo(prefix: Path) {
  const target = new State<Route>();
  return (route: Route) => {
    if (route.path.length < prefix.length) {
      return target;
    }

    for (let i = 0; i < prefix.length; i++) {
      if (route.path[i] !== prefix[i]) {
        return target;
      }
    }

    const relative: Route = {
      ...route,
      path: route.path.slice(prefix.length),
    }; //

    target.set(relative);
    return target;
  };
}

type ViewResolver<TView> = (path: Path) => TView;
