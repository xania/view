import { Path } from './path';
import { compilePathTemplate, PathTemplate } from './path-template';

export function pathMatcher(path: PathTemplate | string | undefined | null) {
  if (!path) {
    return emptyMatcher;
  }

  const matchers = compilePathTemplate(
    path instanceof Array ? path : path.split('/')
  );
  return (path: Path) => {
    const params = {};
    let applied = 0;
    for (let i = 0, len = matchers.length; i < len; i++) {
      const matcher = matchers[i];
      const match = matcher(path, applied);
      if (match === false) return null;
      const { length, ...rest } = match;
      applied += length;
      Object.assign(params, rest);
    }
    return { length: applied, params } as RouteSegment;
  };
}

interface RouteParams {
  [key: string]: any;
}

interface RouteSegment {
  length: number;
  params?: RouteParams;
}

export interface RouteResolution<TView = any> {
  appliedPath: string[];
  params?: RouteParams;
  component: RouteComponentInput<TView> | null;
}

export interface RouteMap<TView> {
  match(path: Path): RouteSegment | Promise<RouteSegment> | false;
  component: RouteComponentInput<TView>;
}

export type RouteComponentInput<TView = any> = TView;

const emptySegment: RouteSegment = { length: 0 };
function emptyMatcher(path: Path) {
  if (path.length === 0) {
    return emptySegment;
  }
  return false;
}
