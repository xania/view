import { If, render, state, Stateful } from "@xania/view";
import "./style.scss";

render(<Component />, document.body);
// setTimeout(() => unrender(result1), 3000);

export function Component() {
  const opened = state(false);

  return (
    <>
      <div>
        <button click={opened.update(true)}> + </button>
        <If condition={opened}>
          <hr />
          <span>hello</span>
          <hr />
          <button click={opened.update(false)}>close</button>
          <hr />
        </If>
      </div>
    </>
  );
}
