import { compile, render, state, suspense, update } from "@xania/view";

export async function Component() {
  const count = state(1);
  const selected = state(false);

  const oddOrEven = count.map((x) => delay(x % 2 === 0 ? "even" : "odd"));

  return suspense(
    <>
      <div>
        Count:{count} ({oddOrEven})
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
  return (
    <>
      <Component />
      <Component />
      <Component />
    </>
  );

  // const program = await compile(<Component />);
  // return program!.asComponent((view) => {
  //   view.render();
  //   view.render();
  //   view.render();
  // });
}

render(
  <>
    <h2>Counters and toggles</h2>
    <Compiled />
  </>,
  document.body
);

function delay<T>(value: T, millis: number = 400) {
  console.log("delay", millis);
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), millis);
  });
}
