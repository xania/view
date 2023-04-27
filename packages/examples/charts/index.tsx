import { state } from "xania";
import { Title } from "../components/heading";
import { Page } from "../components/page";

export function App() {
  return (
    <Page>
      <Title>Charts</Title>

      <svg>
        <Stack>
          <Rect width={100} />
        </Stack>
      </svg>
    </Page>
  );
}

interface StackProps {
  children: JSX.Children;
}
function Stack(props: StackProps) {
  console.log(props.children);

  return props.children;
}

interface RectProps {
  width: number;
}

function Rect(props: RectProps) {
  const rx = state(10);

  return (
    <rect
      click={() => rx.update((x) => x + 2)}
      width={props.width}
      height={100}
      rx={rx}
    ></rect>
  );
}
