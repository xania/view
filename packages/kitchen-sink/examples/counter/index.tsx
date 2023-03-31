import { state } from "@xania/view";
import { Page } from "../../src/page";

/**
 * There are no rules about where u can put your state
 */
const time = () => new Date().toLocaleTimeString();
// setInterval(() => state.set(time()), 1000);

export function App() {
  /**
   * Typically, state should be part of your Component
   */
  const count = state(0);

  return (
    <Page>
      <div>
        <button click={count.update((x) => x + 1)}>Count: {count}</button>
      </div>
    </Page>
  );
}
