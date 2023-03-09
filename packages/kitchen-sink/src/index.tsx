import { WebApp, route, RouteInput } from "@xania/router";
import { render } from "@xania/view";
import classes from "./webapp.module.scss";
import "./root.scss";

export const routes: RouteInput<any>[] = [
  route(["invoices"], () => import("./invoices").then((e) => e.InvoiceApp)),
];

WebApp({
  routes,
  theme: classes,
  renderPage(view) {
    return render(view, document.body);
  },
}).render(document.body);
