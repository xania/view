import { compile, render, state, update } from "@xania/view";

export function Component() {
  const count = state(1);
  const selected = state(false);

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

render(<Component />, document.body);
