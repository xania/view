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

export function view() {
  const counter = new State(1);
  counter.subscribe({
    next(c) {
      console.log("counter", c);
    },
  });
  return function client() {
    setInterval(() => counter.set((x) => x + 1), 1000);
  };
}
