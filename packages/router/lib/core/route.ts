import { Component } from 'xania';
import { Path } from './path';
import { RouteMap } from './route-resolver';

export function Route(
  props: RouteProps<JSX.Children | ((...arg: any[]) => JSX.Children)>
): JSX.Element {
  return new Component(Route, props);
}

export interface RouteProps<TView> {
  path?: RouteMap<TView>['match'] | Path | string;
  children: RouteMap<TView>['component'];
}
