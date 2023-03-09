import {
  Path,
  RouteComponent,
  RouteComponentInput,
  RouteContext,
  Router,
  RouteResolution,
  RouteResolver,
} from '../core';
import { createRouteResolver, RouteInput } from '../core';

import boxes from './animations/boxes';
import { createBrowser } from '../browser-router';
import { CssClasses } from './page';
import { distinct, State } from '@xania/state';

import webapp from './webapp.module.scss';
import { Disposable, disposeAll, Tree } from './disposable';

export interface WebAppProps<TView> {
  routes: RouteInput<TView>[];
  router?: Router;
  // rootView: any;
  theme: Partial<CssClasses>;
  renderPage(view: TView): Tree<Disposable>;
}

export function WebApp<TView>(props: WebAppProps<TView>) {
  const {
    routes,
    router = createBrowser([]),
    theme = {} as CssClasses,
  } = props;
  const rootResolve = createRouteResolver(routes);

  return {
    attachTo(target: HTMLElement) {
      if (theme.outlet) target.classList.add(theme.outlet);

      const outletRoot = document.createElement('div');
      const rootPageContext: PageContext<TView> = {
        path: [],
        resolvePath: rootResolve,
      };

      return router.routes
        .pipe(distinct('path'))
        .bind((route) => {
          const loader = createLoader(target);

          if (theme['outlet__root--collapsed'])
            if (route.path.length > 0) {
              outletRoot.classList.add(theme['outlet__root--collapsed']);
            } else {
              outletRoot.classList.remove(theme['outlet__root--collapsed']);
            }

          const page = new State<Page<TView>>();
          traverse(rootPageContext, route.path, (p: Page<TView>) =>
            page.set(p)
          ).then(() => {
            setTimeout(() => loader.remove(), 200);
          });
          return page;
        })
        .subscribe({
          next(page) {
            const { parent } = page;
            if (parent.next) {
              disposeNext(parent);
            }
            parent.next = page;

            if (page.view !== null) {
              page.renderResult = props.renderPage(page.view);
            }
          },
        });
    },
  };
}

function traverse<TView>(
  parent: PageContext<TView>,
  childPath: Path,
  report: (p: Page<TView>) => void
): Promise<void> {
  function traverseNext(
    next: PageContext<TView>,
    routeResolution: RouteResolution
  ) {
    const remaining = childPath.slice(routeResolution.appliedPath.length);

    // if (routeResolution.appliedPath.length === 0)
    //   return new PageEnd(parent, remaining);

    return traverse(next, remaining, report);
  }

  return parent.resolvePath(childPath).then(async (childResolution) => {
    if (childResolution) {
      if (parent.next) {
        const { path } = parent.next;

        if (matchPath(childResolution.appliedPath, parent.next.path)) {
          return traverseNext(parent.next, childResolution);
        }
      }

      const { view, routes } = await applyComponent(
        childResolution.component,
        new PageRouteContext(parent, childResolution)
      );

      const child = new Page(
        childResolution.appliedPath,
        {},
        createRouteResolver(routes),
        parent,
        view
      );
      report(child);

      return traverseNext(child, childResolution);
    } else {
      report(
        new Page<TView>(
          childPath,
          {},
          () => Promise.resolve(null),
          parent,
          null
        )
      );
    }
  });
}

class PageRouteContext implements RouteContext {
  constructor(
    public parent: PageContext<any>,
    public routeResolution: RouteResolution
  ) {}

  get params() {
    // params: parentParams
    // ? { ...parentParams, ...routeResolution.params }
    // : routeResolution.params,
    return {};
  }

  get url() {
    // : `${this.basePath
    //   .map((e) => "/" + e)
    //   .join("")}/${routeResolution.appliedPath.join("/")}`,
    return '/todo';
  }
}

class Page<TView> {
  renderResult?: Tree<Disposable>;

  constructor(
    public path: string[],
    public params: Record<string, any>,
    public resolvePath: RouteResolver,
    public parent: PageContext<TView>,
    public view: TView | null
  ) {}
}

function applyComponent<TView>(
  component: RouteComponentInput<TView>,
  config: RouteContext
): Promise<RouteComponent> {
  const result = component instanceof Function ? component(config) : component;

  if (result instanceof Promise) {
    return result
      .catch((err) => (console.error(err), { view: 'ERROR: ' + err.message }))
      .then(buildResult);
  } else {
    return Promise.resolve(buildResult(result));
  }

  function buildResult(
    view: unknown
  ): Promise<RouteComponent> | RouteComponent {
    if (view === null || view === undefined) return { view: null };

    const result = view instanceof Function ? view() : view;
    if (result.view) {
      return result;
    } else {
      return { view: result };
    }
  }
}

interface PageContext<TView = any> {
  path: Path;
  next?: Page<TView>;
  resolvePath: RouteResolver<TView>;
}

function createLoader(target: HTMLElement) {
  const animation = boxes();
  const loader = document.createElement('div');

  loader.className = webapp.loading;

  loader.appendChild(animation);
  target.appendChild(loader);

  return loader;
}
function disposeNext(parent: PageContext) {
  while (parent.next) {
    disposeAll(parent.next.renderResult);
    parent.next.renderResult = undefined;
    parent = parent.next;
  }
}

function matchPath(x: Path, y: Path) {
  if (x.length === 0) return true;

  for (let i = 0; i < x.length; i++) {
    if (y[i] !== x[i]) return false;
  }

  return true;
}

class PageEnd {
  constructor(public parent: PageContext, public remaingPath: Path) {}
}
