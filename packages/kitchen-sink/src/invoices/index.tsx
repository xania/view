import { route, RouteComponent } from "@xania/router";

export function InvoiceApp() {
  return {
    view: <section>invoices {new Date().getTime()}</section>,
    routes: [route(["hello"], Hello), route(["hi"], Hi)],
  };
}

function Hello() {
  return (
    <section>
      <div>hello {new Date().getTime()}</div>
      <a class="router-link" href="./hi">
        hi
      </a>
    </section>
  );
}

function Hi() {
  return (
    <section>
      <div>hi {new Date().getTime()}</div>
      <a class="router-link" href="./hello">
        hello
      </a>
    </section>
  );
}
