import { Attrs, useState } from "xania";
import { Link } from "xania/router";
import { LayoutProps } from "./props";

export function Navigation(props: LayoutProps) {
  return (
    <nav class="fixed top-0 z-50 w-full bg-white dark:border-gray-700 dark:bg-gray-900">
      <div class="px-3 py-3 lg:px-5 lg:pl-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center justify-start">
            <button
              click={props.drawerOpen.update((x) => !x)}
              data-drawer-target="logo-sidebar"
              data-drawer-toggle="logo-sidebar"
              aria-controls="logo-sidebar"
              type="button"
              class="inline-flex items-center rounded-lg p-2 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 sm:hidden"
            >
              <span class="sr-only">Open sidebar</span>
              <svg
                class="h-6 w-6"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  clip-rule="evenodd"
                  fill-rule="evenodd"
                  d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                ></path>
              </svg>
            </button>
            <Logo />
          </div>
          <div class="flex items-center">
            <DarkModeButton />

            <div class="ml-3 flex items-center">
              <div>
                <button
                  type="button"
                  class="mx-2 flex rounded-full  bg-gray-800 text-sm focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                  aria-expanded="false"
                  data-dropdown-toggle="dropdown-user"
                >
                  <span class="sr-only">Open user menu</span>
                  <img
                    class="h-8 w-8 rounded-full"
                    src="https://flowbite.com/docs/images/people/profile-picture-5.jpg"
                    alt="user photo"
                  />
                </button>
              </div>
              <div
                class="z-50 my-4 hidden list-none divide-y divide-gray-100 rounded bg-white text-base shadow dark:divide-gray-600 dark:bg-gray-700"
                id="dropdown-user"
              >
                <div class="px-4 py-3" role="none">
                  <p class="text-sm text-gray-900 dark:text-white" role="none">
                    Neil Sims
                  </p>
                  <p
                    class="truncate text-sm font-medium text-gray-900 dark:text-gray-300"
                    role="none"
                  >
                    neil.sims@flowbite.com
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
  //   <>
  //     <nav class="bg-gray-800 dark:bg-black">
  //       <div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
  //         <div class="relative flex h-16 items-center justify-between">
  //           <div class="absolute inset-y-0 left-0 flex items-center sm:hidden">
  //             <button
  //               click={open.update((x) => !x)}
  //               type="button"
  //               class="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
  //               aria-controls="mobile-menu"
  //               aria-expanded="false"
  //             >
  //               <span class="sr-only">Open main menu</span>
  //               <svg
  //                 class="block h-6 w-6"
  //                 fill="none"
  //                 viewBox="0 0 24 24"
  //                 stroke-width="1.5"
  //                 stroke="currentColor"
  //                 aria-hidden="true"
  //               >
  //                 <path
  //                   stroke-linecap="round"
  //                   stroke-linejoin="round"
  //                   d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
  //                 />
  //               </svg>
  //               <svg
  //                 class="hidden h-6 w-6"
  //                 fill="none"
  //                 viewBox="0 0 24 24"
  //                 stroke-width="1.5"
  //                 stroke="currentColor"
  //                 aria-hidden="true"
  //               >
  //                 <path
  //                   stroke-linecap="round"
  //                   stroke-linejoin="round"
  //                   d="M6 18L18 6M6 6l12 12"
  //                 />
  //               </svg>
  //             </button>
  //           </div>
  //           <div class="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
  //             <div class="flex flex-shrink-0 items-center">
  //               <a>
  //                 <Link to="" />
  //                 <img
  //                   class="block h-8 w-auto lg:hidden"
  //                   src="/favicon.svg"
  //                   alt="Xania"
  //                 />
  //                 <img
  //                   class="hidden h-8 w-auto lg:block"
  //                   src="/favicon.svg"
  //                   alt="Xania"
  //                 />
  //               </a>
  //             </div>
  //             <div class="hidden sm:ml-6 sm:block">
  //               <div class="flex space-x-4">
  //                 {navlinks.map((link) => (
  //                   <MenuItem {...link} />
  //                 ))}
  //               </div>
  //             </div>
  //           </div>
  //           <div class="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
  //             <DarkModeButton />
  //             <button
  //               type="button"
  //               class=" ml-3 rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
  //             >
  //               <span class="sr-only">View notifications</span>
  //               <svg
  //                 class="h-6 w-6"
  //                 fill="none"
  //                 viewBox="0 0 24 24"
  //                 stroke-width="1.5"
  //                 stroke="currentColor"
  //                 aria-hidden="true"
  //               >
  //                 <path
  //                   stroke-linecap="round"
  //                   stroke-linejoin="round"
  //                   d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
  //                 />
  //               </svg>
  //             </button>

  //             {/* Profile dropdown */}
  //             <div class="relative ml-3">
  //               <div>
  //                 <button
  //                   click={profile.update((x) => !x)}
  //                   type="button"
  //                   class="flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
  //                   id="user-menu-button"
  //                   aria-expanded="false"
  //                   aria-haspopup="true"
  //                 >
  //                   <span class="sr-only">Open user menu</span>
  //                   <img
  //                     class="h-8 w-8 rounded-full"
  //                     src="https://avatars.githubusercontent.com/u/34893682?s=48&v=4"
  //                     alt=""
  //                   />
  //                 </button>
  //               </div>

  //               {/*

  //                 Dropdown menu, show/hide based on menu state.

  //                 Entering: "transition ease-out duration-100"
  //                   From: "transform opacity-0 scale-95"
  //                   To: "transform opacity-100 scale-100"
  //                 Leaving: "transition ease-in duration-75"
  //                   From: "transform opacity-100 scale-100"
  //                   To: "transform opacity-0 scale-95"

  //               */}
  //               <div
  //                 class={[
  //                   "absolute right-0 z-10 mt-2 hidden w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
  //                   ,
  //                   profile.toggle(
  //                     "scale-100 transform opacity-100 transition duration-100 ease-out",
  //                     "scale-95 transform opacity-0 transition duration-75 ease-in"
  //                   ),
  //                 ]}
  //                 role="menu"
  //                 aria-orientation="vertical"
  //                 aria-labelledby="user-menu-button"
  //                 tabindex="-1"
  //               >
  //                 <a
  //                   href="#"
  //                   class="block px-4 py-2 text-sm text-gray-700"
  //                   role="menuitem"
  //                   tabindex="-1"
  //                   id="user-menu-item-0"
  //                 >
  //                   Your Profile
  //                 </a>
  //                 <a
  //                   href="#"
  //                   class="block px-4 py-2 text-sm text-gray-700"
  //                   role="menuitem"
  //                   tabindex="-1"
  //                   id="user-menu-item-1"
  //                 >
  //                   Settings
  //                 </a>
  //                 <a
  //                   href="#"
  //                   class="block px-4 py-2 text-sm text-gray-700"
  //                   role="menuitem"
  //                   tabindex="-1"
  //                   id="user-menu-item-2"
  //                 >
  //                   Sign out
  //                 </a>
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //       </div>

  //       {/* Mobile menu, show/hide based on menu state */}
  //       <div class={["sm:hidden", open.false("hidden")]} id="mobile-menu">
  //         <div class="space-y-1 px-2 pb-3 pt-2">
  //           {/* Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" */}
  //           {navlinks.map((link) => (
  //             <a
  //               class="router-link block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
  //               click={open.update(false)}
  //             >
  //               <Link to={link.href} class="bg-gray-900" />
  //               {link.title}
  //             </a>
  //           ))}
  //         </div>
  //       </div>
  //     </nav>
  //   </>
  // );
}

function DarkModeButton() {
  const init =
    localStorage.getItem("color-theme") === "dark" ||
    (!("color-theme" in localStorage) &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (init) {
    document.documentElement.classList.add("dark");
  }

  const dark = useState(init);
  return (
    <button
      id="theme-toggle"
      data-tooltip-target="tooltip-toggle"
      type="button"
      class="rounded-full  p-1 text-gray-600 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 dark:text-gray-300 "
      click={dark.update(toggle)}
    >
      <Attrs class={dark} />
      <svg
        aria-hidden="true"
        class="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z">
          <Attrs class={dark.when(true, "hidden", null)} />
        </path>
        <path
          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
          fill-rule="evenodd"
          clip-rule="evenodd"
        >
          <Attrs class={dark.when(false, "hidden", null)} />
        </path>
      </svg>
      <span class="sr-only">Toggle dark mode</span>
    </button>
  );

  function toggle(b: boolean) {
    if (b) {
      document.documentElement.classList.remove("dark");
      localStorage.removeItem("color-theme");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("color-theme", "dark");
    }

    return !b;
  }
}

function Logo() {
  return (
    <a class="ml-2 flex md:mr-24">
      <Link to="" />
      <svg
        class="mr-4"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="1.147 44.46 52.153 40.797"
        width={47.527}
        height={36.591}
      >
        <rect
          x="30.018"
          y="56.517"
          width="20.495"
          height="20.495"
          style="stroke: none; fill: rgb(70, 100, 160);"
        ></rect>
        <rect
          class="fill-black dark:fill-gray-100"
          x="18.599"
          y="72.62"
          width="8.784"
          height="8.784"
        ></rect>
        <polygon
          style="stroke: none; fill: rgb(0, 120, 160);"
          points="11.865 47.733 27.383 47.733 27.383 69.692 4.545 69.692 4.545 53.882"
        ></polygon>
      </svg>
      <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white sm:text-2xl">
        Xania
      </span>
    </a>
  );
}
