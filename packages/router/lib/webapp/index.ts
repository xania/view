import {
  Path,
  RouteComponent,
  RouteComponentInput,
  RouteContext,
  Router,
  RouteResolution,
  RouteResolver,
} from '../core';
import { createRouteResolver, RouteMapInput } from '../core';

import boxes from './animations/boxes';
import { createBrowser } from '../browser-router';
import { CssClasses } from './page';
import { distinct, State } from '@xania/state';

import webapp from './webapp.module.scss';
import { Disposable, disposeAll, Tree } from './disposable';

export interface WebAppProps<TView> {
  routeMaps: RouteMapInput<TView>[];
  router?: Router;
  // rootView: any;
  theme: Partial<CssClasses>;
  renderPage(view: TView): Tree<Disposable>;
}

export function WebApp<TView>(props: WebAppProps<TView>) {
  const {
    routeMaps,
    router = createBrowser([]),
    theme = {} as CssClasses,
  } = props;
  const rootResolve = createRouteResolver(routeMaps);

  return {
    attachTo(target: HTMLElement) {
      if (theme.outlet) target.classList.add(theme.outlet);

      const outletRoot = document.createElement('div');
      const rootPageContext: PageContext<TView> = {
        path: [],
        fullpath: [],
        resolvePath: rootResolve,
        router,
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
    public routeResolution: RouteResolution,
    public router = parent.router
  ) {}

  get params() {
    // params: parentParams
    // ? { ...parentParams, ...routeResolution.params }
    // : routeResolution.params,
    return {};
  }

  get fullpath() {
    return this.parent.fullpath.concat(this.routeResolution.appliedPath);
    // : `${this.basePath
    //   .map((e) => "/" + e)
    //   .join("")}/${routeResolution.appliedPath.join("/")}`,
  }
}

class Page<TView> implements PageContext<TView> {
  renderResult?: Tree<Disposable>;

  constructor(
    public path: string[],
    public params: Record<string, any>,
    public resolvePath: RouteResolver,
    public parent: PageContext<TView>,
    public view: TView | null
  ) {}

  next?: Page<TView> | undefined;
  get fullpath(): Path {
    throw new Error('Method not implemented.');
  }

  get router() {
    return this.parent.router;
  }
}

function applyComponent<TView>(
  component: RouteComponentInput<TView>,
  context: RouteContext
): Promise<RouteComponent> {
  try {
    const result =
      component instanceof Function ? component(context) : component;

    if (result instanceof Promise) {
      return result
        .catch((err) => (console.error(err), { view: 'ERROR: ' + err.message }))
        .then(buildResult);
    } else {
      return Promise.resolve(buildResult(result));
    }
  } catch (err) {
    return Promise.resolve({ view: err });
  }

  function buildResult(result: any): Promise<RouteComponent> | RouteComponent {
    if (result === null || result === undefined) return { view: null };

    if (result.view) {
      return result;
    } else {
      return { view: result };
    }
  }
}

interface PageContext<TView = any> extends RouteContext {
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
