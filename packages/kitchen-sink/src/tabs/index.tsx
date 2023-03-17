import {
  ChildRouter,
  RouteContext,
  routeMap,
  RouteMapInput,
} from "@xania/router";
import { Page } from "../page";

import classes from "./tabs.module.scss";

export function TabsApp(context: RouteContext) {
  const routes: RouteMapInput[] = [
    routeMap(["a"], () => <div>a</div>),
    routeMap(["b"], () => <div>b</div>),
  ];

  return (
    <>
      <Page>
        <div>
          tabs
          <a href="/tabs/a" class={["router-link", classes["tab"]]}>
            tab a
          </a>
          <a href="/tabs/b" class={["router-link", classes["tab"]]}>
            tab b
          </a>
        </div>
      </Page>
      <ChildRouter context={context} routeMaps={routes} />
    </>
  );
}
