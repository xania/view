import { update, useState } from "xania";
import { Page } from "../layout/page";
import { delay } from "../utils";

/**
 * There are no rules about where u can put your state
 */

function timeToString() {
  return Promise.resolve(new Date().toLocaleTimeString());
}

export function App() {
  const time = useState(timeToString());
  const count = useState(100);

  return (
    <>
      {update(function* () {
        yield time.update(timeToString);
        // const ms = scope.get(count);
        // yield delay(this, ms);
      })}
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
