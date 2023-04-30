// import classes from "./page.module.scss";

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
    <div class="box-border h-full opacity-75 last:opacity-100  max-sm:fixed max-sm:left-0 max-sm:top-16 max-sm:w-full sm:py-4 sm:pl-4 sm:last:pr-4">
      <Attrs class={props.class} />
      <Attrs
        class={routeContext.trigger.map((t) =>
          t === RouteTrigger.Click
            ? "max-sm:animate-page-in"
            : "border-solid border-red-700"
        )}
      />
      <div class="box-border h-full max-h-[99.9%]  overflow-y-auto overflow-x-hidden border-2 border-solid border-gray-200 bg-white  shadow-lg  dark:border-gray-700 dark:bg-gray-700 dark:text-white">
        [{routeContext.trigger}]{props.children}
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
