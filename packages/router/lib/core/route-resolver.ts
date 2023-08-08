import { Path } from './path';
import { compilePathTemplate, PathTemplate } from './path-template';

export function pathMatcher(path: PathTemplate | string | undefined | null) {
  if (!path) {
    return emptyMatcher;
  }

  const template = compilePathTemplate(Array.isArray(path) ? path : path.split('/'));

  return (path: Path) => {
    const params = {};

    let applied = 0;

    for (const matcher of template) {
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
  component: TView | null;
}

export interface RouteMap<TView> {
  match(path: Path): RouteSegment | Promise<RouteSegment> | false;
  component: TView;
}

const emptySegment: RouteSegment = { length: 0 };

function emptyMatcher(path: Path) {
  if (path.length === 0) {
    return emptySegment;
  }
  
  return false;
}
