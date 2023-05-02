import { RouteEvent, RouteTrigger, Router } from '../core/router';
import { Command, Subscribable, Subscription, state } from 'xania';
import { isEdgeDrag } from './edge-drag';
import { delay } from '../utils';

export interface WebAppProps<TView = any> {
  children: JSX.Sequence<TView>;
  navigate?: () => JSX.Sequence<Command>;
}

export function WebApp<TView>(props: WebAppProps<TView>) {
  const events = state({
    path: location.pathname.split('/').filter((x) => !!x),
    trigger: RouteTrigger.Location,
  });

  // window.addEventListener('popstate', onPopState);

  return [
    observeLocations(),
    WindowEvent({
      type: 'popstate',
      handler(e) {
        const newRoute: RouteEvent = {
          trigger: isEdgeDrag() ? RouteTrigger.EdgeDrag : RouteTrigger.PopState,
          path: location.pathname.split('/').filter((x) => !!x),
        };

        return events.update(newRoute);
      },
    }),
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
      if (props.navigate) {
        yield props.navigate();
      }
    }

    yield delay(observeLocations(location.pathname), 50);
  }
}

interface WindowEventProps<K extends keyof WindowEventMap> {
  type: K;
  handler: (e: WindowEventMap[K]) => any;
}
function WindowEvent<K extends keyof WindowEventMap>(
  props: WindowEventProps<K>
) {
  return {
    subscribe(observer) {
      window.addEventListener(props.type, callback, true);

      return {
        unsubscribe() {
          window.removeEventListener(props.type, callback, true);
        },
      } satisfies Subscription;

      function callback(e: WindowEventMap[K]) {
        const command = props.handler(e);
        if (command) {
          observer.next(command);
        }
      }
    },
  } satisfies Subscribable<Command>;
}
