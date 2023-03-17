import { State } from '@xania/state';
import { render } from '@xania/view';
import {
  createRouteResolver,
  Path,
  Route,
  RouteContext,
  RouteMapInput,
} from '../core';

interface ChildRouterProps<TView> {
  context: RouteContext;
  routeMaps: RouteMapInput<TView>[];
}

export function ChildRouter(props: ChildRouterProps<any>) {
  const { context } = props;
  const { router } = context;
  const childRoutes = router.routes.pipe(relativeTo(context.fullpath));

  const resolve = createRouteResolver(props.routeMaps);

  return {
    attachTo(target: any) {
      const views = childRoutes.bind(async (r: Route) => {
        const resolution = await resolve(r.path);
        if (resolution && resolution.component) {
          const { component } = resolution;
          if (component instanceof Function) {
            return component({ fullpath: [], router });
          }
        }
      });

      return views.subscribe({
        next(v) {
          render(v, target);
        },
      });
    },
    // resolve,
    // view() {
    //   return childRoutes.bind(async (r: Route) => {
    //     const resolution = await resolve(r.path);
    //     if (resolution && resolution.component) {
    //       const { component } = resolution;
    //       if (component instanceof Function) {
    //         return component({ fullpath: [], router });
    //       }
    //     }
    //   });
    // },
  };
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
