import { state } from "@xania/view";
import { Page } from "../components/page";
import { Title } from "../components/heading";

export function App() {
  const count = state(0);

  return (
    <>
      <Title>Counter</Title>

      <Page>
        <button
          class="bg-yellow-500 font-bold py-2 px-4 rounded"
          click={count.update((x) => x + 1)}
        >
          Count: {count}
        </button>
      </Page>
    </>
  );
}
