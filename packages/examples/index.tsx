import { Route, RouteContext, WebApp } from "@xania/router";
import classes from "./webapp.module.scss";
import "./main.css";
import "./dist/output.css";

export function ExamplesApp() {
  return (
    <>
      <WebApp>
        <Navigation />
        <div class={classes["outlet"]}>
          <Route>{() => import("./clock").then((e) => e.App())}</Route>
          <Route path="counter">
            {() => import("./counter").then((e) => e.App())}
          </Route>
          <Route path="time">
            {() => import("./time").then((e) => e.App())}
          </Route>
          <Route path="tabs">
            {() => import("./tabs").then((e) => e.App())}
            <Route path="a">
              {() => import("./time").then((e) => e.App())}
            </Route>
          </Route>
          <Route path="todo">
            {(ctx: RouteContext) => import("./todomvc").then((e) => e.App(ctx))}
          </Route>
        </div>
      </WebApp>
    </>
  );
}

function Navigation() {
  return (
    <>
      <nav class="bg-gray-800">
        <div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
          <div class="relative flex h-16 items-center justify-between">
            <div class="absolute inset-y-0 left-0 flex items-center sm:hidden">
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                aria-controls="mobile-menu"
                aria-expanded="false"
              >
                <span class="sr-only">Open main menu</span>
                <svg
                  class="block h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
                <svg
                  class="hidden h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div class="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
              <div class="flex flex-shrink-0 items-center">
                <img
                  class="block h-8 w-auto lg:hidden"
                  src="/favicon.svg"
                  alt="Xania"
                />
                <img
                  class="hidden h-8 w-auto lg:block"
                  src="/favicon.svg"
                  alt="Xania"
                />
              </div>
              <div class="hidden sm:ml-6 sm:block">
                <div class="flex space-x-4">
                  <MenuItem title="Clock" href="/" />
                  <MenuItem title="Counter" href="/counter" />
                  <MenuItem title="Todo" href="/todo" />
                  {/* <MenuItem title="Counter" href="/counter" />
                  <MenuItem title="Tabs" href="/tabs" />
                  <MenuItem title="Time" href="/time" /> */}
                </div>
              </div>
            </div>
            <div class="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
              <button
                type="button"
                class="rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                <span class="sr-only">View notifications</span>
                <svg
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                  />
                </svg>
              </button>

              <div class="relative ml-3">
                <div>
                  <button
                    type="button"
                    class="flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                    id="user-menu-button"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <span class="sr-only">Open user menu</span>
                    <img
                      class="h-8 w-8 rounded-full"
                      src="https://avatars.githubusercontent.com/u/34893682?s=48&v=4"
                      alt=""
                    />
                  </button>
                </div>
                {/* <div
                  class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                  tabindex="-1"
                >
                  <a
                    href="#"
                    class="block px-4 py-2 text-sm text-gray-700"
                    role="menuitem"
                    tabindex="-1"
                    id="user-menu-item-0"
                  >
                    Your Profile
                  </a>
                  <a
                    href="#"
                    class="block px-4 py-2 text-sm text-gray-700"
                    role="menuitem"
                    tabindex="-1"
                    id="user-menu-item-1"
                  >
                    Settings
                  </a>
                  <a
                    href="#"
                    class="block px-4 py-2 text-sm text-gray-700"
                    role="menuitem"
                    tabindex="-1"
                    id="user-menu-item-2"
                  >
                    Sign out
                  </a>
                </div> */}
              </div>
            </div>
          </div>
        </div>

        <div class="sm:hidden" id="mobile-menu">
          <div class="space-y-1 px-2 pb-3 pt-2"></div>
        </div>
      </nav>
    </>
  );
}

function MenuItem(props: { title: string; current?: boolean; href: string }) {
  const clazz = props.current
    ? "bg-gray-900 text-white block rounded-md px-3 py-2 text-base font-medium"
    : "hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-base font-medium";

  return (
    <a
      href={props.href}
      class={["router-link", clazz]}
      aria-current={props.current && "page"}
    >
      {props.title}
    </a>
  );
}

function MobileMenuItem(props: {
  title: string;
  current?: boolean;
  href: string;
}) {
  return (
    <a
      href={props.href}
      class="router-link text-gray-300 hover:bg-gray-700 hover:text-white block rounded-md px-3 py-2 text-base font-medium"
      aria-current={props.current && "page"}
    >
      {props.title}
    </a>
  );
}
