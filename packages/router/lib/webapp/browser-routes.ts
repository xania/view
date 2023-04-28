// import { distinct, filter, interval, merge, State } from '@xania/state';
import { State } from 'xania';
import { Path } from '../core/path';
import { RouteEvent, RouteTrigger } from '../core/router';

// const locations$ = interval(() => location.pathname, 200).map((pathname) => ({
//   pathname: pathname,
//   trigger: RouteTrigger.Location,
// }));

function browserRoutes(virtualPath: Path) {
  // const clicks$ = clicks();

  const locations$ = new State<RouteEvent>({
    path: location.pathname.split('/').filter((x) => !!x),
    trigger: RouteTrigger.Location,
  });

  return { events: locations$ };

  // return {
  //   events: merge(locations$, popStates$)
  //     .pipe(distinct('pathname'))
  //     .map(({ trigger, pathname }) => ({
  //       trigger,
  //       path: pathname.split('/').filter((x) => !!x),
  //     }))
  //     .pipe(filter((route) => startsWith(route.path, virtualPath))),
  //   // execute(path: string[]) {
  //   //   pushPath(path.join('/'));
  //   // },
  // };
}

interface RouteInput {
  pathname: string;
  trigger: RouteTrigger;
}

// function clicks() {
//   const state = new State<RouteInput>();
//   document.body.addEventListener('click', onClick);

//   function onClick(event: MouseEvent) {
//     const target: HTMLElement = event.target as HTMLElement;
//     if (target) {
//       let anchor: HTMLAnchorElement | null = target.closest('a');

//       if (anchor && anchor.classList.contains('router-link')) {
//         event.preventDefault();
//         const href = anchor.getAttribute('href');

//         if (href && anchor['pathname'] && location.host === anchor['host']) {
//           const pathname = anchor['pathname'];
//           pushPath(pathname);
//           state.next({
//             pathname,
//             trigger: RouteTrigger.Click,
//           });

//           return false;
//         }
//       }
//     }
//   }

//   const sub = {
//     unsubscribe() {
//       document.body.removeEventListener('click', onClick);
//     },
//   };

//   return state;
// }

export function startsWith(route: Path, base: Path) {
  if (base.length === 0) return true;

  if (base.length > route.length) return false;

  for (var i = 0; i < base.length; i++) {
    if (pathCompare(base[i], route[i]) === false) return false;
  }

  return true;

  function pathCompare(prev: any, next: any) {
    if (prev !== next) {
      if (typeof prev === 'string') return false;

      if (prev.toString() !== next) return false;
    }

    return true;
  }
}

function pushPath(pathname: string) {
  let { pathname: old } = window.location;

  if (old + '/' === pathname) {
    window.history.replaceState(pathname, '', pathname);
  } else if (old !== pathname) {
    window.history.pushState(pathname, '', pathname);
  } else {
    // console.error("same as ", pathname);
  }
}

// const popStates$ = new State<RouteInput>(undefined, (subscriber) => {
//   window.addEventListener('popstate', onPopState);
//   function onPopState(event: PopStateEvent) {
//     subscriber.next({
//       pathname: location.pathname,
//       trigger: RouteTrigger.PopState,
//     });
//   }
//   return {
//     unsubscribe() {
//       window.removeEventListener('popstate', onPopState);
//     },
//   };
// });

if ('scrollRestoration' in history) {
  // Back off, browser, I got this...
  history.scrollRestoration = 'manual';
}
