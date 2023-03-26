import { If, render, state, Stateful } from "@xania/view";
import "./style.scss";

render(<Component />, document.body);
// setTimeout(() => unrender(result1), 3000);

export function Component() {
  const opened = state(true);

  return (
    <>
      <div>
        <button click={opened.update(true)}> + </button>
        <button click={opened.update(false)}> &times; </button>
        <If condition={opened}>
          <hr />
          {delay(<span>hello</span>)}
          <hr />
          <button click={opened.update(false)}>close</button>
          <hr />
        </If>
      </div>
    </>
  );
}

function delay<T>(value: T, millis: number = 400) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), millis);
  });
}
