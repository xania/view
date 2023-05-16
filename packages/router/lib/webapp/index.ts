import { RouteEvent, RouteTrigger, Router } from '../core/router';
import { Command, Subscribable, Subscription, useState } from 'xania';
import { isEdgeDrag } from './edge-drag';
import { delay } from '../utils';
import { useRouteContext } from '../core';

export interface WebAppProps<TView = any> {
  children: JSX.Sequence<TView>;
  navigate?: () => JSX.Sequence<Command>;
}

export function WebApp<TView>(props: WebAppProps<TView>) {
  const routeContext = useRouteContext();

  // window.addEventListener('popstate', onPopState);

  return [
    // observeLocations(),
    WindowEvent({
      type: 'popstate',
      handler() {
        const newRoute: RouteEvent = {
          trigger: isEdgeDrag() ? RouteTrigger.EdgeDrag : RouteTrigger.PopState,
          path: location.pathname.split('/').filter((x) => !!x),
        };

        return routeContext.events.update(newRoute);
      },
    }),
    routeContext.events.update({
      path: location.pathname.split('/').filter((x) => !!x),
      trigger: RouteTrigger.Location,
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
