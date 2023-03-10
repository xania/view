import { WebApp, routeMap, RouteMapInput } from "@xania/router";
import { render } from "@xania/view";
import classes from "./webapp.module.scss";
import "./root.scss";
import { Page } from "./page";
import "./body.scss";

export const routeMaps: RouteMapInput<any>[] = [
  routeMap(["invoices"], () =>
    import("./invoices").then((e) => e.InvoiceApp())
  ),
  routeMap(["tabs"], (ctx) => import("./tabs").then((e) => e.TabsApp(ctx))),
];

const appElt = document.getElementById("app")!;

WebApp({
  routeMaps: routeMaps,
  theme: classes,
  renderPage(view) {
    return render(<Page>{view}</Page>, appElt);
  },
}).attachTo(appElt);
