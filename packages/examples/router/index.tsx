import { Route, Link, RouteContext } from "xania/router";
import { Title } from "../components/heading";
import { Page } from "../layout/page";
import { state, Attrs } from "xania";

export function App(context: RouteContext) {
  const current = state<string>();
  return (
    <>
      <Page trigger={context.trigger}>
        <Attrs class="max-w-md" />
        <Title>Router</Title>

        <p>
          The main menu header of this application is built using{" "}
          <code>@xania/router</code>. Additionally we can load child routes
          using <code>Link</code> components as triggers and corresponding
          routes where we declare the view to show
        </p>
        <p>
          Link apply to parent element. when declared a click event is attached
          handle navigation.
        </p>
        <div>
          <button
            class={[
              current.map((x) => (x === "page1" ? "bg-gray-300" : null)),
              "m-2 p-2 border-2",
            ]}
            click={current.update("page1")}
          >
            page 1
            <Link to="button" class="text-blue-100 bg-slate-800" />
          </button>
          <a
            class={[
              current.map((x) => (x === "page2" ? "bg-gray-300" : null)),
              "m-2 p-2 border-2",
            ]}
            click={current.update("page2")}
          >
            page 2
            <Link to="anchor" class="text-blue-100 bg-slate-800" />
          </a>
        </div>
      </Page>

      <Page trigger={context.trigger}>
        <Route path="button">
          <Title>page 1</Title>
        </Route>
        <Route path="anchor">
          <Title>page 2</Title>
        </Route>
      </Page>
    </>
  );
}
