import { Route, RouteContext, RouteMapInput, WebApp } from "@xania/router";
import classes from "./webapp.module.scss";
import "./root.scss";
import "./body.scss";

export function ExamplesApp() {
  const routeMaps: [
    string,
    RouteMapInput["path"],
    RouteMapInput["component"]
  ][] = [
    ["Counter", ["counter"], () => import("./counter").then((e) => e.App())],
    ["Clock", ["clock"], () => import("./clock").then((e) => e.App())],
    ["Time", ["time"], () => import("./time").then((e) => e.App())],
    [
      "Invoices",
      ["invoices"],
      (ctx: RouteContext) => import("./invoices").then((e) => e.App(ctx)),
    ],
    [
      "Home",
      (p) => (p.length === 0 ? [] : null),
      () => import("./clock").then((e) => e.App()),
    ],
  ];

  return (
    <>
      <section>
        <a class="router-link" href="/">
          home
        </a>
        <a class="router-link" href="/tabs">
          tabs
        </a>
        {routeMaps.map((r) => (
          <a class="router-link" href={"/" + r[1]}>
            {r[0]}
          </a>
        ))}
      </section>
      <div class={classes["outlet"]}>
        <WebApp>
          <Route path={"clock"}>
            {() => import("./clock").then((e) => e.App())}
          </Route>
          <Route path={"counter"}>
            {() => import("./counter").then((e) => e.App())}
          </Route>
          <Route path={"time"}>
            {() => import("./time").then((e) => e.App())}
          </Route>
          <Route path={"tabs"}>
            {() => import("./tabs").then((e) => e.App())}
          </Route>
        </WebApp>
      </div>
    </>
  );
}
