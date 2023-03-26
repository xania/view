import { If, List, render, State, state } from "@xania/view";
import "./style.scss";

render([<ListDemo />, <IfDemo />], document.body);
// setTimeout(() => unrender(result1), 3000);

function IfDemo() {
  const opened = state(true);

  return (
    <>
      <div>
        <button click={opened.update(true)}> + </button>
        <button click={opened.update(false)}> &times; </button>
        <If condition={opened}>
          <div>
            {delay(<span>hello</span>)}
            <button click={opened.update(false)}>close</button>
          </div>
        </If>
      </div>
    </>
  );
}

function ListDemo() {
  // const items = state([1, 2, 3]);
  const count = state(1);

  return (
    <div>
      <button click={count.update((x) => x + 1)}>{count}</button>
      <List source={[1, 2]}>
        {(item) => (
          <div>
            <button click={item.update((x) => x + 1)}>
              item: {item.map((x) => x * 2)}
            </button>
            <button click={count.update((x) => x + 1)}>
              count: {count.map((x) => x * 2)}
            </button>
          </div>
        )}
      </List>
    </div>
  );
}

function delay<T>(value: T, millis: number = 400) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), millis);
  });
}
