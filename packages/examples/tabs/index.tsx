import { Route } from "@xania/router";
import { Page } from "../components/page";
import classes from "./tabs.module.scss";
import { delay } from "../utils";

export function App() {
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
        <Route path="a">
          <div>Wait for it...</div>
        </Route>
        {delay(
          <Route path="a">
            <div>Almost there....</div>
            {() => delay(<div>a</div>, 2000)}
          </Route>,
          2000
        )}
        <Route path="b">{() => <div>b</div>}</Route>
        <Route path="c">
          <div>c</div>
        </Route>
        {/* <Router loader={"loading..."} context={context} routeMaps={routes} /> */}
      </Page>
    </>
  );
}
