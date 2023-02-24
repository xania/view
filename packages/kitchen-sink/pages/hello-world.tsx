const a = 123;
class State {
  private observers: any[] = [];
  constructor(public value: number) {}

  set(fn: Function) {
    this.value = fn(this.value);
    for (const obs of this.observers) {
      obs.next(this.value);
    }
  }

  subscribe(obs) {
    this.observers.push(obs);
    return function () {};
  }

  bla = () => {
    console.log(a);
  };
}

export async function view() {
  console.log("hello server!!");

  const ditto = await fetch("https://pokeapi.co/api/v2/pokemon/ditto").then(
    (e) => e.json()
  );

  const abilities = ditto.abilities;

  const state = new State(123);

  function onClick() {
    state.set((x) => x + 1);
  }

  state.subscribe({
    next(value) {
      console.log("server defined observer", value);
    },
  });

  return html(button("btn01", "Click Me!"), () => {
    const btn01 = document.getElementById("btn01")!;
    state.subscribe({
      next(value) {
        console.log("client defined observer", value);
        btn01.innerText = "Counter: " + value;
      },
    });
    btn01!.addEventListener("click", onClick);
  });
}

function button(id: string, label: string) {
  return [`<button id='${id}'>`, label, "</button>"];
}
function html(...children) {
  return [
    "<!DOCTYPE html><html><head></head><body>",
    children,
    "</body></html>",
  ];
}
