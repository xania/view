import { Page } from "../layout/page";
import { Title } from "../components/heading";
import { State } from "xania";

export function App() {
  const count = new State(0);

  return (
    <>
      <Page class="flex-auto">
        <Title>Counter</Title>

        <div class="align-middle flex justify-center p-4">
          <button
            class="bg-yellow-500 font-bold py-2 px-4 rounded"
            click={count.update((x) => x + 1)}
          >
            Count: {count}
          </button>
        </div>
      </Page>
    </>
  );
}
