// import { Value } from '@xania/state';
import { Disposable, State } from 'xania';
import { Path } from './path';
import { RouteEvent, RouteTrigger } from './router';
import { Collection } from 'xania/lib/utils/collection';

export interface RouteContext {
  params?: { [k: string]: any };
  fullpath: Path;
  path: Path;
  events: State<RouteEvent>;
  disposables?: Collection<Disposable>;
  trigger: RouteTrigger;
}

export const routeEvents = new State<RouteEvent>();

export function useRouteContext() {
  return {
    trigger: routeEvents.prop('trigger'),
  };
}
