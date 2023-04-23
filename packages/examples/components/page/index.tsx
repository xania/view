// import classes from "./page.module.scss";

// export function Page(props: { children: JSX.Children }) {
//   return (
//     <div class={classes["page-container"]}>
//       <div class={classes["page"]}>
//         <main class={classes["page__content"]}>{props.children}</main>
//       </div>
//     </div>
//   );
// }

interface PageProps {
  class?: string;
  children: JSX.Children;
}
export function Page(props: PageProps) {
  return (
    <div class={["h-full py-3 pl-3 last:pr-3 box-border", props.class]}>
      <div class="shadow-lg p-4 box-border h-full bg-white overflow-y-auto overflow-x-hidden border-solid border-2 border-gray-200 max-h-[99%]">
        {props.children}
      </div>
    </div>
  );
}

// function iOS() {
//   return (
//     [
//       "iPad Simulator",
//       "iPhone Simulator",
//       "iPod Simulator",
//       "iPad",
//       "iPhone",
//       "iPod",
//     ].includes(navigator.platform) ||
//     // iPad on iOS 13 detection
//     (navigator.userAgent.includes("Mac") && "ontouchend" in document)
//   );
// }
