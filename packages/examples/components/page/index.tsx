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
  children: JSX.Children;
}
export function Page(props: PageProps) {
  return (
    <div class="h-full p-3">
      <div class="shadow-lg block p-4 h-full box-border bg-white overflow-auto border-solid border-2 border-gray-200">
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
