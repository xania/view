import { Disposable, useState } from 'xania';
import { Path } from './path';
import { RouteEvent, RouteTrigger } from './router';
import { Collection } from 'xania/lib/utils/collection';

export interface RouteContext {
  parent?: RouteContext;
  params?: { [k: string]: any };
  fullpath: Path;
  path: Path;
  disposables?: Collection<Disposable>;
  trigger: RouteTrigger;
}

export const message = useState<string>();
export const routeEvents = useState<RouteEvent>();
export const routeParams = useState<Record<string, any>>();
export const routeTransition = useState<
  'activate' | 'deactivate' | 'initialize' | 'destroy' | 'none'
>();

export function useRouteContext() {
  return {
    message,
    events: routeEvents,
    params: routeParams,
    trigger: routeEvents.prop('trigger'),
    transition: routeTransition,
  };
}
