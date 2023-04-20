import { Path } from './path';
import { RouteMap } from './route-resolver';

export function Route(
  props: RouteProps<JSX.Children | ((...arg: any[]) => JSX.Children)>
): JSX.Element {
  throw `error route [${props.path}]`;
}

export interface RouteProps<TView> {
  path?: RouteMap<TView>['match'] | Path | string;
  children: RouteMap<TView>['component'];
}
