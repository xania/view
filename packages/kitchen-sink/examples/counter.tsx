import { State } from "@xania/state";
import { jsx, render } from "@xania/view";

/**
 * There are no rules about where u can put your state
 */
const time = () => new Date().toLocaleTimeString();
const state = new State(time());
setInterval(() => state.set(time()), 1000);

export function App() {
  /**
   * Typically, state should be part of your Component
   */
  const counter = new State(0);

  return (
    <>
      <div>Time: {[[state]]}</div>
      <div>
        Count:
        <button click={(_) => counter.set((x) => (x || 0) + 1)}>
          {counter}
        </button>
      </div>
    </>
  );
}

render(<App />, document.body);
