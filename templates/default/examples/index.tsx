import { WebApp, routeMap } from "@xania/router";
import { render } from "@xania/view";

async function ExamplesApp() {
  const dirs: string[] = await fetch("/examples/list").then(
    (e) => e.json() as any
  );

  const routeMaps = dirs.map(
    (dir) =>
      [
        dir,
        (ctx) =>
          import(/* @vite-ignore */ "/examples/" + dir).then((e) => e.App(ctx)),
      ] as const
  );

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

render(<ExamplesApp />, document.getElementById("app"));
