import { Component } from 'xania';
import { Path } from '../core/path';
import { RouteMap } from '../core/route-resolver';

export function Route(props: RouteProps<JSX.Element>): JSX.Element {
  return new Component(Route, props);
}

export interface RouteProps<TView> {
  path?: RouteMap<TView>['match'] | Path | string;
  children: JSX.Sequence<TView | ((...arg: any[]) => TView)>;
}
