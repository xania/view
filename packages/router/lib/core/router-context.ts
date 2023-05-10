﻿// import { Value } from '@xania/state';
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
export const routeTransition = new State<
  'activate' | 'deactivate' | 'initialize' | 'destroy' | 'none'
>();

export function useRouteContext() {
  return {
    events: routeEvents,
    trigger: routeEvents.prop('trigger'),
    transition: routeTransition,
  };
}
