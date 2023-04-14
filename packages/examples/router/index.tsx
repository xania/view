import { Route, Link } from "@xania/router";
import { state } from "@xania/view";
import { Title } from "../components/heading";
import { Page } from "../components/page";

export function App() {
  const current = state<string>();
  return (
    <>
      <Page>
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
        <button
          class={[
            current.map((x) => (x === "page1" ? "bg-gray-300" : null)),
            "m-2 p-2 border-2 border-solid",
          ]}
          click={current.update("page1")}
        >
          page 1
          <Link to="button" />
        </button>
        <a
          class={[
            current.map((x) => (x === "page2" ? "bg-gray-300" : null)),
            "m-2 p-2 border-2 border-solid",
          ]}
          click={current.update("page2")}
        >
          page 2
          <Link to="anchor" />
        </a>
      </Page>

      <Page>
        <div class="border-solid border-2 border-indigo-600 p-4">
          <Route path="button">page 1</Route>
          <Route path="anchor">page 2</Route>
        </div>
      </Page>
    </>
  );
}
