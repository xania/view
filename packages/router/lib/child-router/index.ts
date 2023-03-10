import { filter, State, Value } from '@xania/state';
import { Path, Route, RouteContext, RouteMapInput } from '../core';

export class ChildRouter<TView> {
  constructor(
    public readonly routes: Value<Route>,
    public readonly resolve: ViewResolver<TView>
  ) {}

  attachTo(element: HTMLElement) {
    const childRouter = this;
    const { routes } = this;

    // return routes.bind(async (r: Route) => {
    //   const resolution = await childRouter.resolve(r.path);
    //   if (resolution && resolution.component) {
    //     const { component } = resolution;
    //     if (component instanceof Function) {
    //       component({ fullpath: [], router: childRouter });
    //     }
    //   }
    // });
  }
}

export function childRouter<TView>(
  context: RouteContext,
  routeMaps: RouteMapInput<TView>[]
) {
  const childRoutes = context.router.routes.pipe(relativeTo(context.fullpath));

  return null;
  // return new ChildRouter(childRoutes, createRouteResolver(routeMaps));
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
