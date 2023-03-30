import { Value } from '@xania/state';
import { render, suspense } from '@xania/view';
import {
  createRouteResolver,
  Path,
  Route,
  RouteContext,
  RouteMapInput,
  RouteResolution,
} from '../core';
import { disposeAll } from '../webapp/disposable';

interface RouterProps<TView> {
  context: RouteContext;
  routeMaps: RouteMapInput<TView>[];
  loader?: any;
}

export function Router(props: RouterProps<any>) {
  const { context, loader } = props;
  const { routes } = context;

  const rootResolve = createRouteResolver(props.routeMaps);

  return {
    attachTo(target: HTMLElement) {
      const views = routes.map(async (route: Route, prevView?: RouteView) => {
        const resolution = await rootResolve(route.path);
        if (!resolution) {
          return null;
        }
        if (prevView) {
          if (
            prevView &&
            matchPath(prevView.resolution.appliedPath, resolution.appliedPath)
          ) {
            return undefined;
          }
        }
        return new RouteView(resolution, context, render(loader, target));
      });

      return [
        views.subscribe({
          prev: undefined as any,
          async next(v) {
            const view = await v;
            const { prev } = this;
            if (prev) {
              disposeAll(prev);
            }
            if (view) {
              this.prev = render(view, target);
            }
          },
        }),
      ];
    },
  };
}

function relativeTo(prefix: Path) {
  return (route: Route) => {
    if (route.path.length < prefix.length) {
      return undefined;
    }

    for (let i = 0; i < prefix.length; i++) {
      if (route.path[i] !== prefix[i]) {
        return undefined;
      }
    }

    const relative: Route = {
      ...route,
      path: route.path.slice(prefix.length),
    }; //

    return relative;
  };
}

class RouteView implements RouteContext {
  public path: Path;
  public fullpath: Path;
  public routes: Value<Route>;

  constructor(
    public resolution: RouteResolution,
    public parent: RouteContext,
    public loader: any
  ) {
    this.path = resolution.appliedPath;
    this.fullpath = [...parent.fullpath, ...resolution.appliedPath];
    this.routes = parent.routes.map(relativeTo(resolution.appliedPath));
  }

  dispose() {
    this.routes.dispose();
  }

  view() {
    const { resolution, loader } = this;
    if (resolution && resolution.component) {
      const { component } = resolution;

      if (component instanceof Function) {
        if (loader) {
          return [
            {
              dispose() {
                disposeAll(loader);
              },
            },
            suspense(component(this)),
            {
              attachTo() {
                disposeAll(loader);
              },
            },
          ];
        } else {
          return component(this);
        }
      }
    }
  }
}

function matchPath(x: Path, y: Path) {
  if (x.length === 0) return true;

  for (let i = 0; i < x.length; i++) {
    if (y[i] !== x[i]) return false;
  }

  return true;
}

function createLoader(target: HTMLElement) {
  // const animation = boxes();
  const loader = document.createTextNode('...'); // document.createElement('div');
  // loader.appendChild(animation);
  // loader.className = webapp.loading;

  target.appendChild(loader);

  return {
    dispose() {
      setTimeout(() => loader.remove(), 200);
    },
  };
}
