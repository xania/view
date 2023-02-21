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
}

export async function view() {
  console.log("hello server!!");

  const ditto = await fetch("https://pokeapi.co/api/v2/pokemon/ditto").then(
    (e) => e.json()
  );

  const state = new State(123);

  return html(button("btn01", "Click Me"), () => {
    console.log("hello client!!", state);

    console.log(ditto.abilities);

    state.subscribe({
      next(value) {
        console.log("client defined observer", value);
      },
    });
    document
      .getElementById("btn01")!
      .addEventListener("click", () => state.set((x) => x + 1));
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
