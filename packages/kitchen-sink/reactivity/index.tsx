import { render } from "@xania/view";
import "../dist/output.css";
import { Attrs } from "@xania/view/headless";
import { State, List, mutations, If, DomCommand } from "@xania/view/reactivity";
import * as Rx from "rxjs";
import * as Ro from "rxjs/operators";

const ibrahim = {
  firstName: "Ibrahim ben Salah",
  active: false,
  abilities: [{ lang: ".NET" }, { lang: "JavaScript" }, { lang: "TypeScript" }],
  address: {
    street: Promise.resolve("Punter"),
    nr: Promise.resolve(315),
  },
};

const user = new State(ibrahim);

const status = user
  .prop("active")
  .map((active) => (active ? "active" : "inactive bg-red-300"));

const abilities = user.prop("abilities").pipe(mutations);

function* onClick() {
  yield user.prop("active").update(toggle);
  yield abilities.update([{ type: "insert", item: { lang: "bla" }, index: 0 }]);
  // yield user
  //   .prop("abilities")
  //   .update(([x, y, z]) => [z, y, x, { lang: x.lang + "!" }]);
  yield user.prop("address").prop("nr").update(increment);
}

const time = new State("");

render(
  <>
    {Rx.timer(0, 1000).pipe(Ro.map((x) => time.update(String(x))))}

    <Attrs class="p-6 bg-red-50" />
    <span class={["p-1 block", status]}>{user.prop("firstName")}</span>

    <button class="border-black-500 border-2 border-solid px-2" click={onClick}>
      + ({user.prop("abilities").map((e) => e.length)})
    </button>

    <span>{time}</span>

    <img
      src="https://interactive-examples.mdn.mozilla.net/media/examples/firefox-logo.svg"
      width="200"
      style={user
        .prop("active")
        .map((b) => `transform: scale(${b ? 0.2 : 1});`)}
    ></img>
    <div class="p-4"></div>

    <input>{focusWhen(user.prop("active"))}</input>

    <If condition={user.prop("active")}>asdfasd</If>

    <div>
      <List source={abilities}>
        {(item) => <li class="animate-move">{item.prop("lang")}</li>}
      </List>
    </div>
    {user
      .prop("address")
      .map((address) =>
        Promise.all([address.street, address.nr]).then(
          ([street, nr]) => `${street} ${nr}`
        )
      )}
  </>,
  document.body
);

function toggle(b: boolean) {
  return !b;
}

function increment(n: number) {
  return n + 1;
}

function focusWhen(editing: State<boolean>) {
  return {
    attachTo(node: HTMLInputElement) {
      return editing.effect((editing) => {
        if (editing && node instanceof HTMLInputElement)
          setTimeout(() => {
            node.focus();
            node.setSelectionRange(0, node.value.length);
          });
      });
    },
  };
}
