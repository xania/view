import { compile, render, state, update } from "@xania/view";

export function Component() {
  const count = state(1);
  const selected = state(false);

  return (
    <>
      <div>Count:{count}</div>
      <div>
        <button click={update(count, (x) => x + 1)}> + </button>
        <button click={update(count, (x) => x - 1)}> - </button>
      </div>
      <button click={update(selected, (x) => !x)}>
        toggle: {selected.map((x) => delay(x ? "on" : "off"))}
      </button>
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

function delay<T>(value: T, millis: number = 1000) {
  console.log("delay", millis);
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), millis);
  });
}
