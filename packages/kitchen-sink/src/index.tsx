import { WebApp, route, RouteInput } from "@xania/router";
import { render } from "@xania/view";
import classes from "./webapp.module.scss";
import "./root.scss";
import { Page } from "./page";
import "./body.scss";

export const routes: RouteInput<any>[] = [
  route(["invoices"], () => import("./invoices").then((e) => e.InvoiceApp)),
];

const appElt = document.getElementById("app")!;

WebApp({
  routes,
  theme: classes,
  renderPage(view) {
    return render(<Page>{view}</Page>, appElt);
  },
}).attachTo(appElt);
