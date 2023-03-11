import {
  childRouter,
  ChildRouter,
  RouteContext,
  routeMap,
  RouteMapInput,
} from "@xania/router";
import { Page } from "../page";

export function InvoiceApp(context: RouteContext) {
  const routes: RouteMapInput[] = [
    routeMap(["hi"], () => <Hi />),
    routeMap(["hello"], () => <Hello />),
  ];

  return (
    <Page>
      <div>invoices {new Date().getTime()}</div>
      {childRouter(context, routes)}
      <div>invoices {new Date().getTime()}</div>
    </Page>
  );

  //   routes: [routeMap(["hello"], Hello), routeMap(["hi"], Hi)],
}

function Hello() {
  return (
    <Page>
      <div>hello {new Date().getTime()}</div>
      <a class="router-link" href="./hi">
        hi
      </a>
    </Page>
  );
}

function Hi() {
  return (
    <Page>
      <div>hi {new Date().getTime()}</div>
      <a class="router-link" href="./hello">
        hello
      </a>
    </Page>
  );
}
