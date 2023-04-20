import { Page } from "../components/page";
import { Title } from "../components/heading";
import { Attrs } from "@xania/view/headless";
import { State } from "@xania/view/reactivity";

export function App() {
  const count = new State(0);

  return (
    <>
      <Page>
        <Attrs class="align-middle" />
        <Title>Counter</Title>

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
