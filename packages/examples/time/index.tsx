import { state, UpdateFunction } from "@xania/view";
import { Page } from "../components/page";
import { delay } from "../utils";

/**
 * There are no rules about where u can put your state
 */

function timeToString() {
  return Promise.resolve(new Date().toLocaleTimeString());
}

export function App() {
  const time = state(timeToString());
  const count = state(100);

  const update: UpdateFunction = function* (scope) {
    yield time.update(timeToString);
    const ms = scope.get(count);
    yield delay(update, ms);
  };

  return (
    <>
      {update}
      <Page>
        <h1>Time</h1>
        <div>{time}</div>
        <div>
          <button click={count.update((x) => x + 100)}>+</button>
          <span style="display: inline-block; width: 60px; text-align: center;">
            {count}
          </span>
          <button click={count.update((x) => x - 100)}>-</button>
        </div>
      </Page>
    </>
  );
}
