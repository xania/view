// import { Value } from '@xania/state';
import {
  Component,
  DomDescriptorType,
  isDomDescriptor,
  sapply,
  smap,
  State,
  Attrs,
  render,
  Sandbox,
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
import { startsWith } from '../webapp/browser-routes';

interface RouterProps<TView> {
  context: RouteContext;
  children: JSX.Sequence<TView>;
  loader?: any;
}

function onClick(href: string, e: JSX.EventContext<Event, Element>) {
  e.event.preventDefault();
  pushPath(href);
}

export function Router(props: RouterProps<any>) {
  const { context, children } = props;

  return smap(sapply(children, [context]), function mapRoutes(child): any {
    if (child instanceof Component) {
      if (child.func === Link) {
        const props: LinkProps = child.props;
        const linkPath = props.to.split('/');

        const href = `/${[...context.fullpath, ...linkPath].join('/')}`;
        const click = new Closure(onClick, href);

        const activeClass = props.class;
        if (activeClass === undefined) {
          return Attrs<HTMLAnchorElement>({
            href,
            click,
          });
        }

        const activeState = context.events.map((e) => {
          startsWith(e.path, linkPath) ? activeClass : '';
        });
        return Attrs<HTMLAnchorElement>({
          href,
          class: activeState,
          click,
        });
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
  public events: State<RouteEvent>;
  // public remaining: Value<Path>;

  constructor(public appliedPath: Path, public parent: RouteContext) {
    this.path = appliedPath;
    this.fullpath = [...parent.fullpath, ...appliedPath];
    this.events = parent.events.map(relativeTo(appliedPath));
    // this.remaining = parent.events.map(remainingTo(resolution.appliedPath));
  }

  // dispose() {
  //   // this.events.dispose();
  // }

  // view() {
  //   const { resolution } = this;
  //   if (resolution && resolution.component) {
  //     const { component } = resolution;

  //     const routeContext: RouteContext = this;
  //     const view = smap(component, (element) => {
  //       if (element instanceof Function) {
  //         return Router({
  //           context: routeContext,
  //           children: element(routeContext),
  //         });
  //       } else {
  //         return Router({
  //           context: routeContext,
  //           children: element,
  //         });
  //       }
  //     });

  //     return view;
  //   }
  // }
}

function routeView(
  component: RouteResolution['component'],
  routeContext: RouteContext
) {
  return smap(component, (element) => {
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

type RouteResult = {
  sandbox: Sandbox<any>;
  appliedPath: Path;
};

class RouteHandler {
  constructor(public context: RouteContext, public props: RouteProps<any>) {}
  attachTo(target: HTMLElement) {
    const { props, context } = this;
    const { path } = props;

    const matchFn = path instanceof Function ? path : pathMatcher(path);

    return context.events.effect(async function mapView(
      route: RouteEvent,
      prevResult?: RouteResult | null | undefined
    ): Promise<RouteResult | null> {
      if (prevResult instanceof Promise) {
        return prevResult.then((resolved) => mapView(route, resolved));
      }
      if (prevResult) {
        if (
          path
            ? pathStartsWith(route.path, prevResult.appliedPath)
            : route.path.length === 0
        ) {
          prevResult.sandbox.update(context.events, route);

          return prevResult;
        }

        unrender(prevResult.sandbox);
      }

      const segment = await matchFn(route.path);
      if (!segment) {
        return null;
      }

      const appliedPath = route.path.slice(0, segment.length);
      // console.log(appliedPath);

      const routeContext: RouteContext = {
        path: appliedPath,
        fullpath: [...context.fullpath, ...appliedPath],
        // remaining: this.context.events.map(remainingTo(appliedPath)),
        events: context.events.map(relativeTo(appliedPath)),
      };

      const view = routeView(
        Router({
          context: routeContext,
          children: props.children,
        }),
        new RouteView(appliedPath, context)
      );

      const sandbox = render(view, target);

      return {
        sandbox,
        appliedPath,
      };

      // const resolution = {
      //   appliedPath,
      //   component: Router({
      //     context: routeContext,
      //     children: props.children,
      //   }),
      //   params: segment.params,
      // } satisfies RouteResolution<any>;

      // return new RouteView(resolution, context);
    });

    // const effect = views.effect((nextValue, previous?: any) => {
    //   const view = nextValue;

    //   if (previous) {
    //     unrender(previous);
    //   }

    //   if (view) {
    //     return render(view, target);
    //   }

    //   return previous;
    // });

    // return effect;

    // return views.subscribe({
    //   prev: undefined as any,
    //   async next(nextValue) {
    //     const view = await nextValue;
    //     const { prev } = this;
    //     if (prev) {
    //       unrender(prev);
    //     }
    //     if (view) {
    //       this.prev = render(view, target);
    //     }
    //   },
    //   complete() {
    //     const { prev } = this;
    //     if (prev) {
    //       unrender(prev);
    //     }
    //   },
    // });
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

/**
 * using this class can help reduce memory garbage compared to adhoc closures to handle events
 */
class Closure<T1, T2, R> {
  constructor(
    public readonly f: (x1: T1, x2: T2) => R,
    public readonly x1: T1
  ) {}

  call(x2: T2) {
    return this.f(this.x1, x2);
  }
}
