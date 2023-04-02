import { Value } from '@xania/state';
import {
  Component,
  DomDescriptorType,
  isDomDescriptor,
  render,
  suspense,
  tmap,
  unrender,
} from '@xania/view';
import {
  createRouteResolver,
  Path,
  pathMatcher,
  Route,
  RouteContext,
  RouteProps,
  RouteResolution,
} from '../core';

interface RouterProps<TView> {
  context: RouteContext;
  children: JSX.Template<TView>;
  loader?: any;
}

export function Router(props: RouterProps<any>) {
  const { context, loader, children } = props;
  const { events } = context;

  return tmap(children, function mapRoutes(child): any {
    if (child instanceof Component) {
      if (child.func === Route) return new RouteHandler(context, child.props);
      else return child;
    } else if (isDomDescriptor(child)) {
      switch (child.type) {
        case DomDescriptorType.Element:
          if (child.children) {
            return {
              ...child,
              children: tmap(child.children, mapRoutes),
            };
          }
        default:
          return child;
      }
    } else {
      return child;
    }
  });

  const rootResolve = createRouteResolver(
    children instanceof Array ? children : [children]
  );

  return {
    attachTo(target: HTMLElement) {
      const views = events.map(
        async (route: RouteEvent, prevView?: RouteView) => {
          const resolution = await rootResolve(route.path);
          if (!resolution) {
            return null;
          }
          if (prevView) {
            if (
              prevView &&
              matchPath(prevView.resolution.appliedPath, resolution.appliedPath)
            ) {
              return prevView;
            }
          }
          return new RouteView(resolution, context, render(loader, target));
        }
      );

      return [
        views.subscribe({
          prev: undefined as any,
          async next(v) {
            const view = await v;
            const { prev } = this;
            if (prev) {
              unrender(prev);
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
  return (route: RouteEvent) => {
    if (route.path.length < prefix.length) {
      return undefined;
    }

    for (let i = 0; i < prefix.length; i++) {
      if (route.path[i] !== prefix[i]) {
        return undefined;
      }
    }

    const relative: RouteEvent = {
      ...route,
      path: route.path.slice(prefix.length),
    }; //

    return relative;
  };
}

class RouteView implements RouteContext {
  public path: Path;
  public fullpath: Path;
  public events: Value<RouteEvent>;

  constructor(
    public resolution: RouteResolution,
    public parent: RouteContext,
    public loader: any
  ) {
    this.path = resolution.appliedPath;
    this.fullpath = [...parent.fullpath, ...resolution.appliedPath];
    this.events = parent.events.map(relativeTo(resolution.appliedPath));
  }

  dispose() {
    this.events.dispose();
  }

  view() {
    const { resolution, loader } = this;
    if (resolution && resolution.component) {
      const { component } = resolution;

      const view = component instanceof Function ? component(this) : component;

      if (loader) {
        return [
          {
            dispose() {
              unrender(loader);
            },
          },
          suspense(view),
          {
            attachTo() {
              unrender(loader);
            },
          },
        ];
      } else {
        return view;
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

export interface RouteEvent {
  path: Path;
  trigger: RouteTrigger;
}

export enum RouteTrigger {
  Click,
  Location,
  PopState,
}

class RouteHandler {
  constructor(public context: RouteContext, public props: RouteProps<any>) {}
  attachTo(target: HTMLElement) {
    const { path } = this.props;

    const matchFn =
      path instanceof Function
        ? path
        : pathMatcher(path instanceof Array ? path : path.split('/'));

    const views = this.context.events.map(
      async (route: RouteEvent, prevView?: RouteView) => {
        if (prevView) {
          if (
            prevView &&
            pathEqual(route.path, prevView.resolution.appliedPath)
          ) {
            return prevView;
          }
        }

        const segment = await matchFn(route.path);
        if (!segment) {
          return null;
        }

        const appliedPath = route.path.slice(0, segment.length);

        const resolution = {
          appliedPath,
          component: this.props.children,
          params: segment.params,
        } satisfies RouteResolution<any>;

        return new RouteView(resolution, this.context, null);
      }
    );

    return views.subscribe({
      prev: undefined as any,
      async next(v) {
        const view = await v;
        const { prev } = this;
        if (prev) {
          unrender(prev);
        }
        if (view) {
          this.prev = render(view, target);
        }
      },
    });

    // return render(this.props.children, target);
  }
}

function pathEqual(p1: Path, p2: Path) {
  if (p1.length !== p2.length) return false;

  for (let i = 0; i < p1.length; i++) {
    if (p1[i] !== p2[i]) return false;
  }

  return true;
}
