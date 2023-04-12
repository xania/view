import { render, state, sequential } from "@xania/view";
import "./style.scss";

const viewable = {
  view() {
    const count = state(1);
    return (
      <div>
        Hi I am viewable ({count})
        <button click={count.update((x) => x + 1)}>+</button>
      </div>
    );
  },
};

const result1 = render(
  <Component title="Concurrent / Default" />,
  document.body
);
// setTimeout(() => unrender(result1), 3000);

render(sequential(<Component title="Suspended" />), document.body);

// const result2 = render(compile(<Component title="Compiled" />), document.body);

// setTimeout(() => unrender(result2), 5000);

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////

export function Component(props: { title: string }) {
  return (
    <>
      {viewable}
      [ordererd: 0, {delay(1, 500)}, 2]
      <div>
        <Counter />
        <h1 class="header">
          {props.title} {delay("1")}, 2
        </h1>
        <div>{new Date().toLocaleTimeString()}</div>
        <button click={(_) => console.log(13)}>asfdasd {"12"}</button>
        <Button label="button 01" />
        <div>{delay(<Button label="button promise" />, 2000)}</div>
        <Button label="button 02" />
      </div>
    </>
  );
}

function Counter() {
  const count = state(1);
  return <button click={count.update((x) => x + 1)}>Count: {count}</button>;
}

interface ButtonProps {
  label: string;
}
function Button(props: ButtonProps) {
  return (
    <button click={(_) => console.log("hello", props.label)}>
      click {props.label}
    </button>
  );
}

function delay<T>(value: T, millis: number = 1000) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), millis);
  });
}
