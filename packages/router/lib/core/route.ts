import { Path } from './path';
import { RouteMap } from './route-resolver';

export function Route(props: RouteProps<JSX.Children>) {
  throw `error route [${props.path}]`;
}

export interface RouteProps<TView> {
  index?: boolean;
  path?: RouteMap<TView>['match'] | Path | string;
  children: RouteMap<TView>['component'];
}
