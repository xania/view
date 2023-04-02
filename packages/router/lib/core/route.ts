import { Path } from './path';
import { RouteMap, RouteMapInput } from './route-resolver';

export function Route(props: RouteProps<JSX.Element>) {
  return `error route [${props.path}]`;
}

interface Route {}

export interface RouteProps<TView> {
  path?: RouteMap<TView>['match'] | Path | string;
  children: RouteMap<TView>['component'];
}

export function routeMap<TView>(
  path: RouteMapInput<TView>['path'],
  component: RouteMapInput<TView>['component']
): RouteMapInput<TView> {
  return {
    path,
    component,
  };
}
