import { browserRoutes } from './browser-routes';
import { Router } from '../core/router';
import { smap } from 'xania';

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
