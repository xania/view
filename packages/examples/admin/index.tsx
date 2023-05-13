import { Link, Route } from "xania/router";
import { Page } from "../layout/page";
import { Title } from "../components/heading";

export function App() {
  return (
    <>
      <Page>
        <Title>Employees</Title>
        <ul>
          <li>
            <a>
              Ibrahim
              <Link to="/clock" />
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
        <Page>
          <Title>Ibrahim</Title>
        </Page>
      </Route>
      <Route path="ramy">
        <Page>
          <Title>Ramy</Title>
        </Page>
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
