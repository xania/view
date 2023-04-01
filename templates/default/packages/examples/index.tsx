import { WebApp, routeMap } from "@xania/router";
import classes from "./webapp.module.scss";
import "./root.scss";
import "./body.scss";

export function ExamplesApp() {
  const routeMaps = [
    ["counter", () => import("./counter").then((e) => e.App())],
    ["time", () => import("./time").then((e) => e.App())],
  ] as const;

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
