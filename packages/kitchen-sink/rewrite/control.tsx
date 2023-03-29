import { If, List, listSource, render, state } from "@xania/view";
import { RenderContext } from "@xania/view/lib/render/render-context";
import "./style.scss";

const result = render(
  [<ListDemo />, <IfDemo />, <ViewableDemo />],
  document.body
) as Promise<RenderContext>;

result.then(() => {
  console.log("render DONE");
});
// setTimeout(() => unrender(result1), 3000);

function IfDemo() {
  const opened = state(true);

  return (
    <>
      <div class={"selected"}>
        <button click={opened.update(true)}> + </button>
        <button click={opened.update(false)}> &times; </button>
        <If condition={opened}>
          <div>
            {delay(<span>hello</span>)}
            {delay(<button click={opened.update(false)}>close</button>, 800)}
          </div>
        </If>
      </div>
    </>
  );
}

function ListDemo() {
  const items = listSource(delay([0, 1, 2], 2000));
  const count = state(Promise.resolve(1));
  return (
    <div>
      <button click={count.update((x) => x + 1)}>
        {count.map((x) => Promise.resolve(x))}
      </button>
      <button click={items.push((arr) => arr.length)}>
        {items.map(String)}.
      </button>
      <List source={items}>
        {(item, dispose) => (
          <div>
            <button click={item.update((x) => x + 1)}>
              item: {item.map((x) => delay(x * 2, 2000))}
            </button>
            <button click={() => Promise.resolve(dispose)}>&times;</button>
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

function ViewableDemo() {
  return {
    view() {
      return <div>hello</div>;
    },
  };
}