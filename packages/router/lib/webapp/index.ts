import { RouteEvent, RouteTrigger, Router } from '../core/router';
import { Command, Subscribable, Subscription } from 'xania';
import { isEdgeDrag } from './edge-drag';
import { useRouteContext } from '../core';

export interface WebAppProps<TView = any> {
  children: JSX.Sequence<TView>;
}

const path = () => location.pathname.split('/').filter((x) => !!x);

export function WebApp<TView>(props: WebAppProps<TView>) {
  const routeContext = useRouteContext();

  return [
    WindowEvent({
      type: "popstate",
      handler: () => {
        const route: RouteEvent = {
          trigger: isEdgeDrag() ? RouteTrigger.EdgeDrag : RouteTrigger.PopState,
          path: path(),
        };

        return routeContext.events.update(route);
      },
    }),
    routeContext.events.update({
      trigger: RouteTrigger.Location,
      path: path(),
    }),
    Router({
      context: {
        trigger: RouteTrigger.Location,
        path: [],
        fullpath: [],
      },
      children: props.children,
    }),
  ];

  // function* observeLocations(
  //   current: string = location.pathname
  // ): Generator<JSX.Sequence<Command>> {
  //   if (current !== location.pathname) {
  //     if (props.navigate) {
  //       yield props.navigate();
  //     }

  //     const newPath = location.pathname.split('/').filter((x) => !!x);
  //     console.log(newPath);

  //     const newRoute: RouteEvent = {
  //       trigger: RouteTrigger.Location,
  //       path: newPath,
  //     };

  //     yield events.update(newRoute);
  //     yield delay(observeLocations(location.pathname), 1000);
  //   } else {
  //     yield delay(observeLocations(current), 1000);
  //   }
  // }
}

interface WindowEventProps<K extends keyof WindowEventMap> {
  type: K;
  handler: (e: WindowEventMap[K]) => any;
}

function WindowEvent<K extends keyof WindowEventMap>(
  props: WindowEventProps<K>
) {
  return {
    subscribe: (observer) => {
      const callback = (e: WindowEventMap[K]) => {
        const command = props.handler(e);

        if (command) {
          observer.next(command);
        }
      }

      window.addEventListener(props.type, callback, true);

      return {
        unsubscribe: () => {
          window.removeEventListener(props.type, callback, true);
        }
      } satisfies Subscription;
    },
  } satisfies Subscribable<Command>;
}
