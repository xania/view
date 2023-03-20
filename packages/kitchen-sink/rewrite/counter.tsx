import { State } from "@xania/state";
import { compile, render } from "@xania/view";
import { update } from "./update";

export function Component() {
  const count = new State(1);
  const selected = new State(false);

  return (
    <>
      <div>Count:{count}</div>
      <button click={update(selected, (x) => !x)}>
        toggle: {selected.map((x) => (x ? "on" : "off"))}
      </button>
      <div>
        <button click={update(count, (x) => x + 1)}> + </button>
        <button click={update(count, (x) => x - 1)}> - </button>
      </div>
    </>
  );
}

async function Compiled() {
  const program = await compile(<Component />);
  return program!.asComponent((view) => {
    view.render();
    view.render();
    view.render();
  });
}

render(<Compiled />, document.body);
