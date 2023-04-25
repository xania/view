import { Value } from '@xania/state';
import {
  Component,
  DomDescriptor,
  DomDescriptorType,
  isDomDescriptor,
  render,
  sapply,
  smap,
  unrender,
} from 'xania';
import {
  Link,
  LinkProps,
  Path,
  pathMatcher,
  Route,
  RouteContext,
  RouteProps,
  RouteResolution,
} from '../core';
import { State } from 'xania';
import { Attrs } from 'xania/headless';
import { startsWith } from '../webapp/browser-routes';

interface RouterProps<TView> {
  context: RouteContext;
  children: JSX.Sequence<TView>;
  loader?: any;
}

export function Router(props: RouterProps<any>) {
  const { context, children } = props;

  return smap(sapply(children, [context]), function mapRoutes(child): any {
    if (child instanceof Component) {
      if (child.func === Link) {
        const props: LinkProps = child.props;
        const linkPath = props.to.split('/');

        const href = `/${[...context.fullpath, ...linkPath].join('/')}`;

        const activeClass = props.class;
        if (activeClass === undefined) {
          return Attrs({
            href,
            click(e: JSX.EventContext) {
              e.event.preventDefault();
              pushPath(href);
            },
          });
        }

        const activeState = new State('');
        return [
          Attrs({
            href,
            class: activeState,
            click(e: JSX.EventContext) {
              e.event.preventDefault();
              pushPath(href);
            },
          }),
          context.events.map((e) => {
            return activeState.update(
              startsWith(e.path, linkPath) ? activeClass : ''
            );
          }),
        ];
      }
      if (child.func === Route) {
        return new RouteHandler(context, child.props);
      } else {
        return smap(child.execute(), mapRoutes);
      }
    } else if (isDomDescriptor(child)) {
      switch (child.type) {
        case DomDescriptorType.Element:
          if (child.children) {
            return {
              ...child,
              children: smap(child.children, mapRoutes),
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

function remainingTo(prefix: Path) {
  return (route: RouteEvent) => {
    if (route.path.length < prefix.length) {
      return undefined;
    }

    for (let i = 0; i < prefix.length; i++) {
      if (route.path[i] !== prefix[i]) {
        return undefined;
      }
    }

    return route.path.slice(prefix.length);
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
  // public remaining: Value<Path>;

  constructor(public resolution: RouteResolution, public parent: RouteContext) {
    this.path = resolution.appliedPath;
    this.fullpath = [...parent.fullpath, ...resolution.appliedPath];
    this.events = parent.events.map(relativeTo(resolution.appliedPath));
    // this.remaining = parent.events.map(remainingTo(resolution.appliedPath));
  }

  dispose() {
    this.events.dispose();
  }

  view() {
    const { resolution } = this;
    if (resolution && resolution.component) {
      const { component } = resolution;

      const routeContext: RouteContext = this;
      const view = smap(component, (element) => {
        if (element instanceof Function) {
          return Router({
            context: routeContext,
            children: element(routeContext),
          });
        } else {
          return Router({
            context: routeContext,
            children: element,
          });
        }
      });

      return view;
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
        // console.log(appliedPath);

        const routeContext: RouteContext = {
          path: appliedPath,
          fullpath: [...this.context.fullpath, ...appliedPath],
          // remaining: this.context.events.map(remainingTo(appliedPath)),
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

        return new RouteView(resolution, this.context);
      }
    );

    return views.subscribe({
      prev: undefined as any,
      async next(nextValue) {
        const view = await nextValue;
        const { prev } = this;
        if (prev) {
          unrender(prev);
        }
        if (view) {
          this.prev = render(view, target);
        }
      },
      complete() {
        const { prev } = this;
        if (prev) {
          unrender(prev);
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

function pushPath(pathname: string) {
  let { pathname: old } = window.location;

  if (old + '/' === pathname) {
    window.history.replaceState(pathname, '', pathname);
  } else if (old !== pathname) {
    window.history.pushState(pathname, '', pathname);
  } else {
    // console.error("same as ", pathname);
  }
}
