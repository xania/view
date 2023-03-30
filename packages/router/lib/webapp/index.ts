import { RouteMapInput } from '../core';

import { browserRoutes } from './browser-routes';
import { Router } from '../core/router';

export interface WebAppProps<TView> {
  routeMaps: RouteMapInput<TView>[];
}

export function WebApp<TView>(props: WebAppProps<TView>) {
  const { routeMaps } = props;

  return Router({
    context: {
      path: [],
      fullpath: [],
      routes: browserRoutes([]).routes,
    },
    routeMaps,
  });
}
