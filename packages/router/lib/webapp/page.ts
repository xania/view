import { State } from '@xania/state';
import {
  createRouteResolver,
  Path,
  Route,
  RouteComponent,
  RouteContext,
  RouteResolution,
  RouteResolver,
} from '../core';

const duration = 400;

export class Page {
  private _binding: ViewBinding | null = null;
  public next?: Page;
  public _resolution?: RouteResolution;
  public _view: any;
  private _container?: HTMLElement;

  constructor(
    public target: HTMLElement,
    public basePath: Path,
    public resolveRoute: RouteResolver,
    public classes: Partial<CssClasses>
  ) {}

  clear() {
    this.clearNext();
    if (this._binding) {
      this._binding.dispose();
      this._binding = null;
    }
    this._resolution = undefined;
  }

  clearNext() {
    if (this.next) {
      this.next.clear();
      if (this.next._container) {
        this.next._container!.remove();
      }
      this.next = undefined;
    }
  }

  matchResolution(routeResolution: RouteResolution) {
    return (
      this._resolution &&
      matchPath(this._resolution.appliedPath, routeResolution.appliedPath)
    );
  }

  async bind(
    view: any,
    routeResolution: RouteResolution,
    context: ViewContext
  ) {
    const { classes } = this;
    if (!this._container) {
      const div = document.createElement('div');
      if (classes['page-container'])
        div.classList.add(classes['page-container']);
      if (classes['page-container--inactive'])
        div.classList.add(classes['page-container--inactive']);
      this.target.appendChild(div);

      this._container = div;
    }
    const { _container } = this;
    this._view = view;

    if (this.matchResolution(routeResolution)) {
      return false;
    }

    this._resolution = routeResolution;

    if (this._binding) {
      const oldBinding = this._binding;
      this._binding = null;
      if (oldBinding && oldBinding.dispose instanceof Function)
        setTimeout(() => oldBinding.dispose(), duration);
    }

    if (view && view.render instanceof Function) {
      this._binding = await unwrapPromise(view.render(_container, context));
      if (classes['page-container--loading'])
        _container.classList.add(classes['page-container--loading']);
      if (classes['page-container--inactive'])
        _container.classList.remove(classes['page-container--inactive']);
      if (classes['page-container--active'])
        _container.classList.add(classes['page-container--active']);
      // _container.scrollIntoView();
      if (classes['page-container--loading']) {
        setTimeout(function () {
          _container.classList.remove(classes['page-container--loading']!);
        }, 400);
      }
    } else {
      this._binding = null;
      if (classes['page-container--active'])
        _container.classList.remove(classes['page-container--active']);
      if (classes['page-container--inactive'])
        _container.classList.add(classes['page-container--inactive']);
    }

    return true;
  }

  resolve = async (route: Route) => {
    const { resolveRoute } = this;

    if (!resolveRoute) return;

    const nextResolution = this.next?._resolution;
    if (nextResolution) {
      if (matchPath(nextResolution.appliedPath, route.path)) {
        return nextResolution;
      }
    }

    return await resolveRoute(route.path);
  };

  navigateTo(route: Route) {
    const { target, next } = this;
    if (next) {
      const nextResolution = next?._resolution;
      if (nextResolution) {
        if (matchPath(nextResolution.appliedPath, route.path)) {
          const remainingPath = route.path.slice(
            nextResolution.appliedPath.length
          );
          const basePath = [...this.basePath, ...nextResolution.appliedPath];
          const res: PageResolution = {
            route: { path: remainingPath, trigger: route.trigger },
            page: this.nextPage(target, basePath, next.resolveRoute),
            view: next._view,
            routeResolution: nextResolution,
          };
          return new State(res);
        }
      }
    }

    return this.resolve(route)
      .catch((err) => {
        console.error(err);
      })
      .then(async (routeResolution) => {
        if (routeResolution) {
          const { _resolution } = this;
          const parentParams = _resolution?.params;

          const { view, routes } = await applyComponent(
            routeResolution.component,
            {
              params: parentParams
                ? { ...parentParams, ...routeResolution.params }
                : routeResolution.params,
              url: `${this.basePath
                .map((e) => '/' + e)
                .join('')}/${routeResolution.appliedPath.join('/')}`,
            }
          );

          const remainingPath = route.path.slice(
            routeResolution.appliedPath.length
          );
          const basePath = [...this.basePath, ...routeResolution.appliedPath];
          const resolveNext =
            routes instanceof Function ? routes : createRouteResolver(routes);
          return {
            route: { path: remainingPath, trigger: route.trigger },
            page: this.nextPage(target, basePath, resolveNext),
            view,
            routeResolution,
          } satisfies PageResolution;
        } else {
          this.clearNext();
        }
      });
  }

  nextPage(target: HTMLElement, basePath: Path, resolveView: RouteResolver) {
    if (this.next) return this.next;
    return (this.next = new Page(target, basePath, resolveView, this.classes));
  }

  createPage = (
    view: any,
    appliedPath: Path,
    resolveNext: RouteResolver<any>,
    route: Route
  ) => {
    const { target } = this;

    const remainingPath = route.path.slice(appliedPath.length);
    return {
      route: { path: remainingPath, trigger: route.trigger },
      page: this.nextPage(target, route.path, resolveNext),
      view,
    } as PageResolution;
  };
}

interface PageResolution {
  route: Route;
  view: any;
  page: Page;
  routeResolution?: RouteResolution;
}

function matchPath(x: Path, y: Path) {
  if (x.length === 0) return true;

  for (let i = 0; i < x.length; i++) {
    if (y[i] !== x[i]) return false;
  }

  return true;
}

function pathEqual(x: Path, y: Path) {
  if (!x || !y) return false;
  if (x.length !== y.length) return false;
  for (let i = 0; i < x.length; i++) {
    if (x[i] !== y[i]) return false;
  }
  return true;
}

let _uid = 0;
let uid = () => {
  return ++_uid;
};

function applyComponent(
  fn: any,
  config: RouteContext
): Promise<RouteComponent> {
  var result = fn(config);
  if (result instanceof Promise) {
    return result
      .catch((err) => (console.error(err), { view: errorPage(err) }))
      .then(buildResult);
  } else {
    return Promise.resolve(buildResult(result));
  }

  function buildResult(result: any) {
    if (!result) return result;
    if (result instanceof Function)
      // typically when using dynamic imports
      return applyComponent(result, config);
    if ('render' in result) {
      return {
        view: result,
      };
    } else {
      return result;
    }
  }
}

function errorPage(err: Error) {
  return err.message;
  // return (
  //   <div style="color: red; padding: 20px; margin: 10px">{err.message}</div>
  // );
}

function unwrapPromise(p: any) {
  if (p === null || p === undefined) return p;
  if (p instanceof Promise) return p;
  else return Promise.resolve(p);
}

export interface ViewContext {
  route: Route;
}

class ViewResult<TView = any> {
  public next?: ViewResult | EmptyResult;

  constructor(
    public view: TView,
    public appliedPath: Path,
    public resolveRoute: RouteResolver,
    public context: ViewContext
  ) {}

  matchPath(newPath: Path) {
    const { appliedPath } = this;
    if (appliedPath.length === 0) return true;

    for (let i = 0; i < appliedPath.length; i++) {
      if (appliedPath[i] !== newPath[i]) return false;
    }

    return true;
  }
}

class RouteResult {
  constructor(public route: Route, public resolveRoute: RouteResolver) {}
}

class EmptyResult {
  constructor(public route: Route, public resolveRoute: RouteResolver) {}
}

export interface CssClasses {
  outlet__root: string;
  outlet: string;
  ['outlet__root--collapsed']: string;
  ['page-container']: string;
  ['page-container--inactive']: string;
  ['page-container--loading']: string;
  ['page-container--active']: string;
}

type ViewBinding = {
  dispose(): void;
};
