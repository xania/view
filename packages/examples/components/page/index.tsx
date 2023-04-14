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
    <div class="border-box h-full box-content border-solid border-2 border-blue-500  bg-slate-300 p-4">
      {props.children}
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
