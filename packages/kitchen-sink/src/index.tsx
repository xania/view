import { WebApp, routeMap, RouteMapInput } from "@xania/router";
import { render } from "@xania/view";
import classes from "./webapp.module.scss";
import "./root.scss";
import "./body.scss";

export const routeMaps: any[] = [
  ["invoices", (ctx) => import("./invoices").then((e) => e.InvoiceApp(ctx))],
  ["tabs", (ctx) => import("./tabs").then((e) => e.TabsApp(ctx))],
  ["counter", (ctx) => import("../examples/counter").then((e) => e.App())],
  ["time", (ctx) => import("../examples/time").then((e) => e.TimeApp())],
];

function App() {
  return (
    <>
      <section>
        <a class="router-link" href="/">
          home
        </a>
        {routeMaps.map((r) => (
          <a class="router-link" href={"/" + r[0]}>
            {r[0]}
          </a>
        ))}
      </section>
      <div class={classes["outlet"]}>
        {WebApp({
          routeMaps: routeMaps.map((r) => routeMap(r[0].split("/"), r[1])),
        })}
      </div>
    </>
  );
}

render(<App />, document.getElementById("app"));
