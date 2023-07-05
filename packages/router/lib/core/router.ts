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
  dispatch,
} from 'xania';
import { RouteContext, useRouteContext } from './router-context';
import { Link, LinkProps } from './link';
import { Route, RouteProps } from './route';
import { Path, resolve } from './path';
import { pathMatcher } from './route-resolver';
import { startsWith } from '../webapp/browser-routes';

const routeContext = useRouteContext();

function onClick([context, href, path]: [RouteContext, string, Path], eventContext: JSX.EventContext<Event, Element>) {
  eventContext.event.preventDefault();

  const command = () => pushPath(href);

  for (const [i, value] of context.fullpath.entries()) {
    if (path[i] != value) {
      return [
        dispatch(routeContext.events.update({
          trigger: RouteTrigger.Click,
          path,
        })),
        routeContext.transition.update('deactivate'),
        command
      ]
    }
  }

  return [
    routeContext.events.update({
      trigger: RouteTrigger.Click,
      path,
    }),
    routeContext.transition.update('deactivate'),
    command
  ]
}

function getLinkAttributes(context: RouteContext, props: LinkProps) {
  const path = resolve(context.fullpath, props.to.split("/"));
  const href = "/" + path.join("/");

  return {
    href,
    click: new Closure(onClick, [context, href, path]),
    linkPath: path,
    context,
  }
}

interface RouterProps<TView = any> {
  context: RouteContext;
  children: JSX.Sequence<TView>;
  loader?: any;
}

export function Router(props: RouterProps) {
  const { context, children } = props;

  return new Transformer<any>(children, (child) => {
    if (child instanceof Component == false) {
      return child;
    }

    const props = child.props;

    if (child.func == Route) {
      return new RouteHandler(context, props);
    } else if (child.func == Link) {
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

  attachTo(target: HTMLElement, factory: NodeFactory<Element, any>, sandbox: Sandbox) {
    const { props, context } = this;
    const { path } = props;

    const matcher = path instanceof Function ? path : pathMatcher(path);

    const mapView = async (route: RouteEvent, previous?: RouteResult | null | undefined): Promise<RouteResult | null> => {
      if (previous instanceof Promise) {
        return previous.then((resolved) => mapView(route, resolved));
      }

      if (previous) {
        if (
          path
            ? pathStartsWith(route.path, previous.appliedPath)
            : route.path.length === 0
        ) {
          previous.sandbox.update(routeContext.events, {
            trigger: route.trigger,
            path: route.path.slice(previous.appliedPath.length),
          });

          previous.sandbox.update(routeContext.transition, (value) =>
            route.trigger === RouteTrigger.EdgeDrag
              ? 'none'
              : previous.appliedPath.length === route.path.length
                ? value === 'deactivate'
                  ? 'activate'
                  : 'none'
                : 'deactivate'
          );

          return previous;
        }

        if (route.trigger !== RouteTrigger.EdgeDrag) {
          destroy(previous.sandbox);

          setTimeout(() => {
            previous.sandbox.dispose();
          }, 200);
        } else {
          previous.sandbox.dispose();
        }

        context.disposables = cremove(context.disposables, previous.sandbox);
      }

      const segment = await matcher(route.path);
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
      }
    }

    return routeContext.events.effect(mapView);
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
  const { pathname: old } = window.location;

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
