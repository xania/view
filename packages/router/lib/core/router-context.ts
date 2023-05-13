// import { Value } from '@xania/state';
import { Disposable, Sandbox, State } from 'xania';
import { Path } from './path';
import { RouteEvent, RouteTrigger } from './router';
import { Collection } from 'xania/lib/utils/collection';

export interface RouteContext {
  parent?: RouteContext;
  params?: { [k: string]: any };
  fullpath: Path;
  path: Path;
  events: State<RouteEvent>;
  disposables?: Collection<Disposable>;
  trigger: RouteTrigger;
}

export const routeEvents = new State<RouteEvent>();
export const routeParams = new State<Record<string, any>>();
export const routeTransition = new State<
  'activate' | 'deactivate' | 'initialize' | 'destroy' | 'none'
>();

export function useRouteContext() {
  return {
    events: routeEvents,
    params: routeParams,
    trigger: routeEvents.prop('trigger'),
    transition: routeTransition,
  };
}
