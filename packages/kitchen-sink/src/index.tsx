﻿import { WebApp, routeMap, RouteMapInput } from "@xania/router";
import { render } from "@xania/view";
import classes from "./webapp.module.scss";
import "./root.scss";
import "./body.scss";

export const routeMaps: RouteMapInput<any>[] = [
  routeMap(["invoices"], (ctx) =>
    import("./invoices").then((e) => e.InvoiceApp(ctx))
  ),
  routeMap(["tabs"], (ctx) => import("./tabs").then((e) => e.TabsApp(ctx))),
];

function App() {
  return (
    <div class={classes["outlet"]}>
      {WebApp({
        routeMaps: routeMaps,
      })}
    </div>
  );
}

render(<App />, document.getElementById("app"));
