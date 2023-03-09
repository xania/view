import { Value } from '@xania/state';
import { Path } from './path';

export interface Router {
  routes: Value<Route>;
}

export interface Route {
  path: Path;
  trigger: RouteTrigger;
}

export enum RouteTrigger {
  Click,
  Location,
  PopState,
}
