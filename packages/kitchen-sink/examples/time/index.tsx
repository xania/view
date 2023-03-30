import { interval } from "@xania/state";
import { render, state } from "@xania/view";
import { Page } from "../../src/page";

/**
 * There are no rules about where u can put your state
 */

function timeToString() {
  return new Date().toLocaleTimeString();
}

export function App() {
  /**
   * Typically, state should be part of your Component
   */
  const time = state(timeToString());

  return (
    <>
      {interval(() => time.update(timeToString))}{" "}
      <Page>
        <h1>Time lord</h1>
        <div>{time}</div>
      </Page>
    </>
  );
}
