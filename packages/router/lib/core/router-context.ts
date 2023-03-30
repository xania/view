import { Value } from '@xania/state';
import { Path } from './path';
import { Route } from './router';

export interface RouteContext {
  params?: { [k: string]: any };
  fullpath: Path;
  path: Path;
  routes: Value<Route>;
}
