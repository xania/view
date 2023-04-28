// import { Value } from '@xania/state';
import { State } from 'xania';
import { Path } from './path';
import { RouteEvent } from './router';

export interface RouteContext {
  params?: { [k: string]: any };
  fullpath: Path;
  path: Path;
  events: State<RouteEvent>;
}
