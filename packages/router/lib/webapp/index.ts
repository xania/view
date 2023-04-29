import { RouteTrigger, Router } from '../core/router';
import { Command, UpdateCommand, state } from 'xania';

export interface WebAppProps<TView = any> {
  children: JSX.Sequence<TView>;
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
      yield events.update({
        trigger: RouteTrigger.Location,
        path: location.pathname.split('/').filter((x) => !!x),
      });
    }

    yield delay(observeLocations(location.pathname), 50);
  }
}

function delay<T>(value: T, millis: number = 400) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), millis);
  });
}
