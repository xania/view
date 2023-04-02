import {
  Router,
  RouteContext,
  routeMap,
  RouteMapInput,
  Route,
} from "@xania/router";
import { Page } from "../components/page";

import classes from "./tabs.module.scss";

export function App() {
  const routes: RouteMapInput[] = [
    routeMap(["a"], () => delay(<div>a</div>, 2000)),
    routeMap(["b"], () => <div>b</div>),
  ];

  return (
    <>
      <Page>
        <div>
          tabs
          <a href="/tabs/a" class={["router-link", classes["tab"]]}>
            tab a
          </a>
          <a href="/tabs/b" class={["router-link", classes["tab"]]}>
            tab b
          </a>
          <a href="/tabs/c" class={["router-link", classes["tab"]]}>
            tab c
          </a>
        </div>
      </Page>
      <Page>
        <Route path="a">{() => delay(<div>a</div>, 2000)}</Route>
        <Route path="b">{() => <div>b</div>}</Route>
        <Route path="c">
          <div>c</div>
        </Route>
        {/* <Router loader={"loading..."} context={context} routeMaps={routes} /> */}
      </Page>
    </>
  );
}

function delay<T>(value: T, millis: number = 400) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), millis);
  });
}
