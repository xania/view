import { Value } from '@xania/state';
import { Path } from './path';
import { RouteEvent } from './router';

export interface RouteContext {
  params?: { [k: string]: any };
  fullpath: Path;
  path: Path;
  events: Value<RouteEvent>;
}
