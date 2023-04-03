import { Path } from './path';
import { RouteMap } from './route-resolver';

export function Route(props: RouteProps<JSX.Element>) {
  return `error route [${props.path}]`;
}

export interface RouteProps<TView> {
  path?: RouteMap<TView>['match'] | Path | string;
  children: RouteMap<TView>['component'];
}
