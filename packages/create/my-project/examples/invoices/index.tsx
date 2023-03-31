import { Router, RouteContext, routeMap, RouteMapInput } from "@xania/router";
import { Page } from "../../src/page";

export function App(context: RouteContext) {
  const routes: RouteMapInput[] = [
    routeMap(["hi"], () => <Hi />),
    routeMap(["hello"], () => <Hello />),
  ];

  return (
    <>
      <Page>
        <div>invoices {new Date().getTime()}</div>
        <a class="router-link" href={"/" + context.fullpath.join("/") + "/hi"}>
          hi
        </a>
        <a
          class="router-link"
          href={"/" + context.fullpath.join("/") + "/hello"}
        >
          hello
        </a>
      </Page>
      <Page>
        <Router context={context} routeMaps={routes} />
      </Page>
      <Page>
        <div>invoices {new Date().getTime()}</div>
      </Page>
    </>
  );
}

function Hello() {
  return (
    <>
      <div>hello {new Date().getTime()}</div>
    </>
  );
}

function Hi() {
  return (
    <>
      <div>hi {new Date().getTime()}</div>
    </>
  );
}
