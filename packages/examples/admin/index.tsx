import { Link, Route } from "xania/router";
import { Page } from "../layout/page";
import { Title } from "../components/heading";
import { ForEach, List, each, useState } from "xania";
import { ListApp } from "./list-app";

export function App() {
  return (
    <>
      <Page>
        <Title>Employees</Title>
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
        <div>
          <List source={[{ name: 1 }, { name: 2 }]}>
            {(row) => (
              <a class="m-1 block border-2 border-red-400 text-center hover:bg-red-950 hover:text-white">
                {row.prop("name")}

                <Link to="asdf" />
              </a>
            )}
          </List>
        </div>
      </Page>
      <Route path="ibrahim">
        <Page>
          <Title>Ibrahim</Title>
          <a>
            Go up
            <Link to={".."} />
          </a>

          <ListApp />
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
