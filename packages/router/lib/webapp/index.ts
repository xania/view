import { RouteMapInput } from '../core';

import { browserRoutes } from './browser-routes';
import { Router } from '../core/router';
import { tmap } from '@xania/view';

export interface WebAppProps<TView = any> {
  children: JSX.Sequence<TView>;
}

export function WebApp<TView>(props: WebAppProps<TView>) {
  return Router({
    context: {
      path: [],
      fullpath: [],
      events: browserRoutes([]).events,
    },
    children: props.children,
  });
}
