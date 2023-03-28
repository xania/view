import { If, List, listSource, render, state } from "@xania/view";
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
  const items = listSource([0, 1, 2]);
  const count = state(Promise.resolve(1));
  return (
    <div>
      <button click={count.update((x) => x + 1)}>
        {count.map((x) => Promise.resolve(x))}
      </button>
      <button click={items.push((arr) => arr.length)}>
        {items.map(JSON.stringify)}
      </button>
      <List source={items}>
        {(item) => (
          <div>
            <button click={item.update((x) => x + 1)}>
              item: {item.map((x) => x * 2)}
            </button>
            <button click={items.remove(item)}>&times;</button>
            {/* <button click={count.update((x) => x + 1)}>
              count: {count.map((x) => x * 2)}
            </button> */}
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
