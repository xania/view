import { Path } from '../core/path';

export function startsWith(route: Path, base: Path) {
  if (base.length === 0) return true;

  if (base.length > route.length) return false;

  for (var i = 0; i < base.length; i++) {
    if (pathCompare(base[i], route[i]) === false) return false;
  }

  return true;

  function pathCompare(prev: any, next: any) {
    if (prev !== next) {
      if (typeof prev === 'string') return false;

      if (prev.toString() !== next) return false;
    }

    return true;
  }
}

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
