import { Attrs, state } from "xania";
import { Navigation } from "./nav";
import { MainMenu } from "./mainmenu";
import { WebApp } from "xania/router";
import classes from "./layout.module.scss";

export function Layout(props: { children: JSX.Children }) {
  const drawerOpen = state(false);

  return (
    <WebApp
      navigate={() =>
        drawerOpen.update(!location.pathname || location.pathname === "/")
      }
    >
      <Attrs class="pt-14" />
      <Navigation drawerOpen={drawerOpen} />

      <aside
        id="logo-sidebar"
        class={[
          "fixed left-0 top-0 z-40 h-screen w-64 bg-white pt-20 dark:bg-gray-800 ",
          drawerOpen.toggle(
            classes["drawer--activate"],
            classes["drawer--deactivate"]
          ),
        ]}
        aria-label="Sidebar"
      >
        <div class="h-full overflow-y-auto px-3 pb-4">
          <MainMenu />
        </div>
      </aside>

      <div
        click={drawerOpen.update(false)}
        drawer-backdrop=""
        class={[
          "fixed inset-0 z-30 bg-gray-900 bg-opacity-50 dark:bg-opacity-80 ease-linear antialiased",
          drawerOpen.false("hidden"),
        ]}
      ></div>

      <AppContainer>{props.children}</AppContainer>
    </WebApp>
  );
}

function AppContainer(props: { children: JSX.Children }) {
  return (
    <div class="border-box relative m-0 flex flex-auto flex-row overflow-auto bg-gray-100 p-0 align-middle dark:bg-gray-600 sm:ml-64">
      {props.children}
    </div>
  );
}
