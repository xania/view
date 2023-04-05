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
  Path,
  pathMatcher,
  Route,
  RouteContext,
  RouteProps,
  RouteResolution,
} from '../core';

interface RouterProps<TView> {
  context: RouteContext;
  children: JSX.Sequence<TView>;
  loader?: any;
}

export function Router(props: RouterProps<any>) {
  const { context, loader, children } = props;
  const { events } = context;

  return tmap(children, function mapRoutes(child): any {
    if (child instanceof Component) {
      if (child.func === Route) return new RouteHandler(context, child.props);
      else if (child.props?.children) {
        return new Component(child.func, {
          ...child.props,
          children: tmap(child.props.children, mapRoutes),
        });
      } else return child;
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

    const matchFn = path instanceof Function ? path : pathMatcher(path);

    const views = this.context.events.map(
      async (route: RouteEvent, prevView?: RouteView) => {
        if (prevView) {
          const prevResolution = prevView.resolution;
          if (
            path
              ? pathStartsWith(route.path, prevResolution.appliedPath)
              : route.path.length === 0
          ) {
            return prevView;
          }
        }

        const segment = await matchFn(route.path);
        if (!segment) {
          return null;
        }

        const appliedPath = route.path.slice(0, segment.length);

        const routeContext = {
          path: appliedPath,
          fullpath: [...this.context.fullpath, ...appliedPath],
          events: this.context.events.map(relativeTo(appliedPath)),
        };

        const resolution = {
          appliedPath,
          component: Router({
            context: routeContext,
            children: this.props.children,
          }),
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
  }
}

function pathStartsWith(p1: Path, prefix: Path) {
  if (p1.length < prefix.length) return false;

  for (let i = 0; i < prefix.length; i++) {
    if (p1[i] !== prefix[i]) return false;
  }

  return true;
}
