import {
  Sandbox,
  cpush,
  cremove,
  Disposable,
  Collection,
  cwalk,
  NodeFactory,
  renderStack,
  Transformer,
  Component,
  Attrs,
  UpdateStateCommand,
} from 'xania';
import { RouteContext, useRouteContext } from './router-context';
import { Link, LinkProps } from './link';
import { Route, RouteProps } from './route';
import { Path, resolve, toString } from './path';
import { pathMatcher } from './route-resolver';
import { startsWith } from '../webapp/browser-routes';

const routeContext = useRouteContext();

function onClick(
  [linkPath, context]: [Path, RouteContext],
  e: JSX.EventContext<Event, Element>
) {
  e.event.preventDefault();

  const path = resolve(context.fullpath, linkPath);

  setTimeout(() => {
    pushPath(toString(path));
  }, 20);

  return [
    routeContext.events.update({
      trigger: RouteTrigger.Click,
      path: path,
    }),
    routeContext.transition.update('deactivate'),
  ];
}

type LinkAttributes = {
  href: string,
  click: Closure<[Path, RouteContext], JSX.EventContext<Event, Element>, UpdateStateCommand<any>[]>,
  linkPath: string[],
  context: RouteContext
}

function getLinkAttributes(context: RouteContext, props: LinkProps): LinkAttributes {
  const to = props.to;

  let linkPath: string[] = [];

  if (to && to[0] == "/") {
    let initial = context;

    while (initial.parent) {
      initial = initial.parent;
    }

    return {
      href: to,
      click: new Closure(onClick, [linkPath, initial]),
      linkPath: linkPath,
      context: initial,
    };
  }

  linkPath = resolve(context.fullpath, linkPath);

  return {
    href: toString(linkPath),
    click: new Closure(onClick, [linkPath, context]),
    linkPath: linkPath,
    context,
  };
}

interface RouterProps<TView = any> {
  context: RouteContext;
  children: JSX.Sequence<TView>;
  loader?: any;
}

export function Router(props: RouterProps) {
  const { context, children } = props;

  return new Transformer<any>(children, (child) => {
    if (child instanceof Component) {
      const props = child.props;

      switch (child.func) {
        case Route:
          return new RouteHandler(context, props);
        case Link:
          const linkAttributes = getLinkAttributes(context, props);

          const active = props.class;

          if (active === undefined) {
            return Attrs<HTMLAnchorElement>({
              href: linkAttributes.href,
              click: linkAttributes.click,
            });
          }

          const activeState = routeContext.events.map((e) =>
            startsWith(e.path, linkAttributes.linkPath) ? active : ''
          );

          return Attrs<HTMLAnchorElement>({
            href: linkAttributes.href,
            click: linkAttributes.click,
            class: activeState,
          });
      }
    }
    return child;
  });

  // return smap(children, function mapRoutes(child): any {
  //   if (child instanceof Component) {
  //     if (child.func === Link) {
  //       const props: LinkProps = child.props;

  //       const linkAttrs = getLinkAttrs(context, props);

  //       const activeClass = props.class;
  //       if (activeClass === undefined) {
  //         return Attrs<HTMLAnchorElement>({
  //           href: linkAttrs.href,
  //           click: linkAttrs.click,
  //         });
  //       }

  //       const activeState = routeContext.events.map((e) =>
  //         startsWith(e.path, linkAttrs.linkPath) ? activeClass : ''
  //       );
  //       return Attrs<HTMLAnchorElement>({
  //         href: linkAttrs.href,
  //         click: linkAttrs.click,
  //         class: activeState,
  //       });
  //     }
  //     if (child.func === Route) {
  //       return new RouteHandler(context, child.props);
  //     } else {
  //       return smap(child.execute(), mapRoutes);
  //     }
  //   } else if (isDomDescriptor(child)) {
  //     switch (child.type) {
  //       case DomDescriptorType.Element:
  //         if (child.children) {
  //           return {
  //             ...child,
  //             children: smap(child.children, mapRoutes),
  //           };
  //         }
  //       default:
  //         return child;
  //     }
  //   } else {
  //     return child;
  //   }
  // });
}

class ChildRouteContext implements RouteContext {
  public path: Path;
  public fullpath: Path;
  public disposables?: Collection<Disposable>;

  constructor(
    public parent: RouteContext,
    public params: RouteContext['params'],
    public trigger: RouteTrigger,
    public childPath: Path
  ) {
    this.path = childPath;
    this.fullpath = [...parent.fullpath, ...childPath];
  }

  dispose() {
    cwalk(this.disposables, (d) => d.dispose());
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
  EdgeDrag,
}

type RouteResult = {
  sandbox: Sandbox;
  appliedPath: Path;
};

class RouteHandler {
  constructor(public context: RouteContext, public props: RouteProps<any>) { }

  attachTo(
    target: HTMLElement,
    factory: NodeFactory<Element, any>,
    sandbox: Sandbox
  ) {
    const { props, context } = this;
    const { path } = props;

    const matchFn = path instanceof Function ? path : pathMatcher(path);

    return routeContext.events.effect(async function mapView(
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
          prevResult.sandbox.update(routeContext.events, {
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
        appliedPath
      );
      const view = Router({
        context: childRouteContext,
        children: props.children,
      });

      const routeSandbox = new Sandbox(sandbox);

      renderStack<any, any>(
        [[routeSandbox, target as any, view, true]],
        factory,
        []
      );

      routeSandbox.update(
        routeContext.transition,
        route.trigger === RouteTrigger.EdgeDrag
          ? 'none'
          : remainingPath.length === 0
            ? 'initialize'
            : 'none'
      );

      if (segment.params) {
        routeSandbox.update(routeContext.params, segment.params);
      }

      routeSandbox.update(routeContext.events, {
        trigger: route.trigger,
        path: remainingPath,
      });

      context.disposables = cpush(context.disposables, routeSandbox);
      routeSandbox.disposables = cpush(
        routeSandbox.disposables,
        childRouteContext
      );

      return {
        sandbox: routeSandbox,
        appliedPath,
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

  if (old === pathname) {
    window.history.replaceState(pathname, '', pathname);
  } else {
    window.history.pushState(pathname, '', pathname);
  }
}

/**
 * using this class can help reduce memory garbage compared to adhoc closures to handle events
 */
class Closure<T1, T2, R> {
  constructor(
    public readonly f: (x1: T1, x2: T2) => R,
    public readonly x1: T1
  ) { }

  call(x2: T2) {
    return this.f(this.x1, x2);
  }
}

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
