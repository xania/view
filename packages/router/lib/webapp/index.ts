import { RouteEvent, RouteTrigger, Router } from '../core/router';
import { Command, UpdateCommand, state } from 'xania';

export interface WebAppProps<TView = any> {
  children: JSX.Sequence<TView>;
  navigate?: (route: RouteEvent) => JSX.Sequence<Command>;
}

export function WebApp<TView>(props: WebAppProps<TView>) {
  const events = state({
    path: location.pathname.split('/').filter((x) => !!x),
    trigger: RouteTrigger.Location,
  });

  return [
    observeLocations(),
    Router({
      context: {
        trigger: RouteTrigger.Location,
        path: [],
        fullpath: [],
        events,
      },
      children: props.children,
    }),
  ];

  function* observeLocations(
    current: string = location.pathname
  ): Generator<JSX.Sequence<Command>> {
    if (current !== location.pathname) {
      const newRoute: RouteEvent = {
        trigger: RouteTrigger.Location,
        path: location.pathname.split('/').filter((x) => !!x),
      };

      if (props.navigate) {
        yield props.navigate(newRoute);
      }
      yield events.update(newRoute);
    }

    yield delay(observeLocations(location.pathname), 50);
  }
}

function delay<T>(value: T, millis: number = 400) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), millis);
  });
}
