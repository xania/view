import { WebApp, routeMap, RouteMapInput } from "@xania/router";
import { render } from "@xania/view";
import classes from "./webapp.module.scss";
import "./root.scss";
import "./body.scss";
import { Page } from "./page";

export const routeMaps: RouteMapInput<any>[] = [
  routeMap(["invoices"], (ctx) =>
    import("./invoices").then((e) => e.InvoiceApp(ctx))
  ),
  routeMap(["tabs"], (ctx) => import("./tabs").then((e) => e.TabsApp(ctx))),
];

const appElt = document.getElementById("app")!;

WebApp({
  routeMaps: routeMaps,
  theme: classes,
  render(view) {
    return render(view, appElt);
  },
}).attachTo(appElt);
