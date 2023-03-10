import {
  childRouter,
  RouteContext,
  routeMap,
  RouteMapInput,
} from "@xania/router";

import classes from "./tabs.module.scss";

export function TabsApp(context: RouteContext) {
  const routes: RouteMapInput[] = [
    routeMap(["a"], () => <div>a</div>),
    routeMap(["b"], () => <div>b</div>),
  ];

  return (
    <div>
      <div>
        tabs
        <a href="/tabs/a" class={["router-link", classes["tab"]]}>
          tab a
        </a>
        <a href="/tabs/b" class={["router-link", classes["tab"]]}>
          tab b
        </a>
      </div>
      <div>{childRouter(context, routes)}</div>
    </div>
  );
}
