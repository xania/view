import { compile, render, state, suspense, update } from "@xania/view";

export function Component() {
  const count = state(1);
  const selected = state(false);

  return suspense(
    <>
      <div>
        Count:{count} (debounced: {count.map(delay)})
      </div>
      <div>
        <button click={update(count, (x) => x + 1)}> + </button>
        <button click={update(count, (x) => x - 1)}> - </button>
      </div>
      <button click={update(selected, (x) => !x)}>
        delayed toggle: {selected.map((x) => (x ? "on" : "off"))}
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

render(
  <>
    <h2>Counters and toggles</h2>
    <Component />
  </>,
  document.body
);

function delay<T>(value: T, millis: number = 400) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), millis);
  });
}
