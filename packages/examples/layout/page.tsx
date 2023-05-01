﻿import classes from "./page.module.scss";

import { AnchorNode, Attachable, Attrs, state } from "xania";
import { RouteTrigger, useRouteContext, routeEvents } from "xania/router";

interface PageProps {
  class?: string;
  children: JSX.Children;
  trigger?: RouteTrigger;
  // scrollIntoView?: boolean;
}
export function Page(props: PageProps) {
  const routeContext = useRouteContext();

  return (
    <div class="box-border h-full max-sm:fixed max-sm:left-0 max-sm:top-16 max-sm:w-full shadow-lg sm:py-4 sm:pl-4 sm:pr-4 bg-white dark:bg-gray-700">
      <Attrs class={props.class} />
      <Attrs
        class={routeContext.transition.map((b) => classes[`page--${b}`])}
      />
      <div class="box-border h-full max-h-[99.9%]  overflow-y-auto overflow-x-hidden border-2 border-solid border-gray-200 shadow-lg dark:border-gray-700 dark:text-white">
        {props.children}

        <div>
          [{routeContext.trigger.map((t) => RouteTrigger[t])}]
          {routeContext.transition.map((b) => `page--${b}`)}
        </div>
      </div>

      {scrollIntoView()}
    </div>
  );
}

function scrollIntoView() {
  return {
    attachTo(element) {
      if (element instanceof AnchorNode) {
        element.anchorNode.scrollIntoView();
      } else {
        element.scrollIntoView({ block: "end" });
      }
    },
  } satisfies Attachable;
}

// function iOS() {
//   return (
//     [
//       "iPad Simulator",
//       "iPhone Simulator",
//       "iPod Simulator",
//       "iPad",
//       "iPhone",
//       "iPod",
//     ].includes(navigator.platform) ||
//     // iPad on iOS 13 detection
//     (navigator.userAgent.includes("Mac") && "ontouchend" in document)
//   );
// }