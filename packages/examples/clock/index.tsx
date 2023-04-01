import { state } from "@xania/view";
import classes from "./clock.module.scss";
import { delay } from "../utils";

export function App() {
  return (
    <div class={classes["Clock"]}>
      <header class={classes["Clock-header"]}>
        <Clock />
      </header>
    </div>
  );
}

export function Clock() {
  var now = state(0);
  const update = function* update() {
    const d = new Date();
    yield now.update(d.getTime() - d.getTimezoneOffset() * 60000);

    // schedule update after 1 sec
    yield delay(update, 1000);
  };

  function transform(fn: (d: number) => number) {
    return (d: number) => `transform: rotate(${fn(d)}deg);`;
  }

  return (
    <>
      {update}
      <section>
        <div class={classes["label"]}>SEIKO</div>
        <div
          class={classes["hourhand"]}
          style={now.map(transform(hours))}
        ></div>
        <div
          class={classes["secondhand"]}
          style={now.map(transform(seconds))}
        ></div>
        <div
          class={classes["minutehand"]}
          style={now.map(transform(minutes))}
        ></div>
        <div class={classes["hour12"]}></div>
        <div class={classes["hour1"]}></div>
        <div class={classes["hour2"]}></div>
        <div class={classes["hour3"]}></div>
        <div class={classes["hour4"]}></div>
        <div class={classes["hour5"]}></div>
      </section>
      <span class={classes["credits"]}>
        design by <a href="https://codepen.io/nilsynils">Nils Rasmusson</a>
      </span>
    </>
  );
}

function seconds(d: number) {
  return (360 * (d % 60000)) / 60000 - 90;
}

function minutes(d: number) {
  return (360 * (d % 3600000)) / 3600000 - 90;
}

function hours(d: number) {
  return (360 * (d % 43200000)) / 43200000 - 90;
}
