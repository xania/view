import { Link, Route } from "@xania/router";
import { Attrs } from "@xania/view/headless";
import { Page } from "../components/page";

export function App() {
  return (
    <>
      <Page>
        <PageHeader>Employees</PageHeader>
        <ul>
          <li>
            <a>
              Ibrahim
              <Link to="ibrahim" />
            </a>
          </li>
          <li>
            <a>
              Ramy
              <Link to="ramy" />
            </a>
          </li>
        </ul>
      </Page>
      <Route path="ibrahim">
        <Page>Ibrahim</Page>
      </Route>
      <Route path="ramy">
        <Page>Ramy</Page>
      </Route>
    </>
  );
}

////////////////////////

///////////////////

interface PageHeaderProps {
  children: string;
}
function PageHeader(props: PageHeaderProps) {
  return <header>{props.children}</header>;
}
