import { Router, RouteContext, routeMap, RouteMapInput } from "@xania/router";
import { Page } from "../page";

export function InvoiceApp(context: RouteContext) {
  const routes: RouteMapInput[] = [
    routeMap(["hi"], () => <Hi />),
    routeMap(["hello"], () => <Hello />),
  ];

  return (
    <>
      <Page>
        <div>invoices {new Date().getTime()}</div>
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
      <a class="router-link" href="./hi">
        hi
      </a>
    </>
  );
}

function Hi() {
  return (
    <>
      <div>hi {new Date().getTime()}</div>
      <a class="router-link" href="./hello">
        hello
      </a>
    </>
  );
}
