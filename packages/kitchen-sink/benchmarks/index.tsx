import { State } from "@xania/state";
import { render } from "@xania/view";
import { cases, runCase } from "../../state/test/kairo/cases";

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
      <h1>Kairo benmark</h1>
      <div>
        <button click={(_) => runCase(cases.avoidablePropagation)}>run</button>
      </div>
    </>
  );
}

render(<App />, document.body);
