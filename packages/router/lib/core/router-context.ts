import { Path } from './path';
import { Router } from './router';

export interface RouteContext {
  params?: { [k: string]: any };
  fullpath: Path;
  router: Router;
}
