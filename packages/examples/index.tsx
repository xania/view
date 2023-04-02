import { Route, RouteContext, RouteMapInput, WebApp } from "@xania/router";
import classes from "./webapp.module.scss";
import "./root.scss";
import "./body.scss";

export function ExamplesApp() {
  return (
    <>
      <div class={classes["outlet"]}>
        <WebApp>
          <Route>
            <a class="router-link" href="/">
              home
            </a>
            <a class="router-link" href="/clock">
              counter
            </a>
            <a class="router-link" href="/tabs">
              tabs
            </a>
            <a class="router-link" href="/time">
              time
            </a>
            <a class="router-link" href="/clock">
              clock
            </a>
          </Route>
          <Route path={"clock"}>
            {() => import("./clock").then((e) => e.App())}
          </Route>
          <Route path="counter">
            {() => import("./counter").then((e) => e.App())}
          </Route>
          <Route path="time">
            {() => import("./time").then((e) => e.App())}
          </Route>
          <Route path="tabs">
            {() => import("./tabs").then((e) => e.App())}
            <Route path="a">
              {() => import("./time").then((e) => e.App())}
            </Route>
          </Route>
        </WebApp>
      </div>
    </>
  );
}
