﻿// import { Value } from '@xania/state';
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
  cpush,
  cremove,
  Disposable,
  Collection,
  cwalk,
} from 'xania';
import { startsWith } from '../webapp/browser-routes';
import { RouteContext, routeEvents, useRouteContext } from './router-context';
import { Link, LinkProps } from './link';
import { Route, RouteProps } from './route';
import { Path } from './path';
import { RouteResolution, pathMatcher } from './route-resolver';
import { delay } from '../utils';

interface RouterProps<TView> {
  context: RouteContext;
  children: JSX.Sequence<TView>;
  loader?: any;
}

const routeContext = useRouteContext();

function onClick(
  [linkPath, context]: [Path, RouteContext],
  e: JSX.EventContext<Event, Element>
) {
  e.event.preventDefault();

  setTimeout(() => {
    pushPath(`/${[...context.fullpath, ...linkPath].join('/')}`);
  }, 20);

  return delay(
    [
      context.events.update({
        trigger: RouteTrigger.Click,
        path: linkPath,
      }),
      routeContext.transition.update('deactivate'),
    ],
    0
  );
}

function getLinkAttrs(context: RouteContext, props: LinkProps) {
  const to = props.to;
  const linkPath = to.split('/').filter((e) => e);
  if (to.startsWith('/')) {
    let root = context;
    while (root.parent) {
      root = root.parent;
    }

    return {
      href: to,
      click: new Closure(onClick, [linkPath, root]),
      linkPath,
      context: root,
    };
  } else {
    return {
      href: `/${[...context.fullpath, ...linkPath].join('/')}`,
      click: new Closure(onClick, [linkPath, context]),
      linkPath,
      context,
    };
  }
}

export function Router(props: RouterProps<any>) {
  const { context, children } = props;

  return smap(sapply(children, [context]), function mapRoutes(child): any {
    if (child instanceof Component) {
      if (child.func === Link) {
        const props: LinkProps = child.props;

        const linkAttrs = getLinkAttrs(context, props);

        const activeClass = props.class;
        if (activeClass === undefined) {
          return Attrs<HTMLAnchorElement>({
            href: linkAttrs.href,
            click: linkAttrs.click,
          });
        }

        const activeState = linkAttrs.context.events.map((e) => {
          startsWith(e.path, linkAttrs.linkPath) ? activeClass : '';
        });
        return Attrs<HTMLAnchorElement>({
          href: linkAttrs.href,
          click: linkAttrs.click,
          class: activeState,
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

class ChildRouteContext implements RouteContext {
  public path: Path;
  public fullpath: Path;
  public disposables?: Collection<Disposable>;

  constructor(
    public parent: RouteContext,
    public params: RouteContext['params'],
    public trigger: RouteTrigger,
    public childPath: Path,
    public events: State<RouteEvent>
  ) {
    this.path = childPath;
    this.fullpath = [...parent.fullpath, ...childPath];
  }

  dispose() {
    cwalk(this.disposables, (d) => d.dispose());
  }
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
  EdgeDrag,
}

type RouteResult = {
  sandbox: Sandbox;
  appliedPath: Path;
  events: State<RouteEvent>;
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
          prevResult.sandbox.update(prevResult.events, {
            trigger: route.trigger,
            path: route.path.slice(prevResult.appliedPath.length),
          });

          prevResult.sandbox.update(routeContext.transition, (previous) =>
            route.trigger === RouteTrigger.EdgeDrag
              ? 'none'
              : prevResult.appliedPath.length === route.path.length
              ? previous === 'deactivate'
                ? 'activate'
                : 'none'
              : 'deactivate'
          );

          return prevResult;
        }

        if (route.trigger !== RouteTrigger.EdgeDrag) {
          destroy(prevResult.sandbox);

          setTimeout(() => {
            prevResult.sandbox.dispose();
          }, 200);
        } else {
          prevResult.sandbox.dispose();
        }
        context.disposables = cremove(context.disposables, prevResult.sandbox);
      }

      const segment = await matchFn(route.path);
      if (!segment) {
        return null;
      }

      const appliedPath = route.path.slice(0, segment.length);
      const remainingPath = route.path.slice(segment.length);

      const childRouteContext = new ChildRouteContext(
        context,
        segment.params,
        route.trigger,
        appliedPath,
        routeEvents
      );
      const view = routeView(
        Router({
          context: childRouteContext,
          children: props.children,
        }),
        childRouteContext
      );

      const sandbox = render(view, target);

      sandbox.update(
        routeContext.transition,
        route.trigger === RouteTrigger.EdgeDrag
          ? 'none'
          : remainingPath.length === 0
          ? 'initialize'
          : 'none'
      );

      if (segment.params) {
        sandbox.update(routeContext.params, segment.params);
      }

      sandbox.update(routeEvents, {
        trigger: route.trigger,
        path: remainingPath,
      });

      context.disposables = cpush(context.disposables, sandbox);
      sandbox.disposables = cpush(sandbox.disposables, childRouteContext);

      return {
        sandbox,
        appliedPath,
        events: routeEvents,
      };
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
// function pushPath(href: string) {
//   throw new Error('Function not implemented.');
// }

function destroy(sandbox: Sandbox) {
  sandbox.update(useRouteContext().transition, 'destroy');

  cwalk(sandbox.disposables, (c) => {
    if (c instanceof ChildRouteContext) {
      cwalk(c.disposables, (d) => {
        if (d instanceof Sandbox) destroy(d);
      });
    }
  });
}
