import { route, RouteComponent } from "@xania/router";

export function InvoiceApp() {
  return {
    view: <>invoices {new Date().getTime()}</>,
    routes: [route(["hello"], Hello), route(["hi"], Hi)],
  };
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
