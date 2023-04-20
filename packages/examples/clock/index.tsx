import classes from "./clock.module.scss";
import { delay } from "../utils";
import { Title } from "../components/heading";
import { state, update } from "@xania/view/reactivity";

export function App() {
  return (
    <div class={classes["Clock"]}>
      <Title>Reactive Clock</Title>
      <br></br>
      <Clock />
      <span class={classes["credits"]}>
        design by <a href="https://codepen.io/rassadin">Nick Rassadin</a>
      </span>
    </div>
  );
}

function now() {
  const d = new Date();
  return d.getTime() - d.getTimezoneOffset() * 60000;
}

export function Clock() {
  var time = state(now());

  function transform(fn: (d: number) => number, shift = "1em") {
    return (d: number) =>
      `transform: translate(0, ${shift}) rotate(${fn(
        d
      )}deg) translate(0, -${shift}) ;`;
  }

  return (
    <>
      {update(function* () {
        yield time.update(now);
        yield delay(this, 1000);
      })}
      <div id={classes["clock"]}>
        <div id={classes["a"]}>
          <div id={classes["b"]}>
            <div id={classes["c"]}>
              <div id={classes["d"]}>
                <div id={classes["sh"]}>
                  <div class={classes["hh"]}>
                    <div
                      style={time.map(transform(hours))}
                      class={classes["h"]}
                    ></div>
                  </div>
                  <div class={classes["mm"]}>
                    <div
                      style={time.map(transform(minutes, "1.6em"))}
                      class={classes["m"]}
                    ></div>
                    <div class={classes["mr"]}></div>
                  </div>
                  <div class={classes["ss"]}>
                    <div
                      style={time.map(transform(seconds))}
                      class={classes["s"]}
                    ></div>
                  </div>
                </div>
                <div id={classes["ii"]}>
                  <b>
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                  </b>
                  <b>
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                  </b>
                  <b>
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                  </b>
                  <b>
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                  </b>
                  <b>
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                  </b>
                  <b>
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                  </b>
                </div>
                <div id={classes["e"]}>
                  <div id={classes["f"]}>
                    <u>
                      12
                      <u>
                        1
                        <u>
                          2<u>3</u>4
                        </u>
                        5
                      </u>
                    </u>
                  </div>
                  <div id={classes["g"]}>
                    <u>
                      <u>
                        11
                        <u>
                          10<u>9</u>8
                        </u>
                        7
                      </u>
                      6
                    </u>
                  </div>
                  <div id={classes["q"]}>
                    <a
                      href=""
                      style="position:relative;z-index:1000;color:#222;text-decoration:none;"
                    >
                      quartz
                    </a>
                  </div>
                </div>
                <div class={classes["hh"]}>
                  <div
                    style={time.map(transform(hours, "1em"))}
                    class={classes["h"]}
                  ></div>
                </div>
                <div class={classes["mm"]}>
                  <div
                    style={time.map(transform(minutes, "1.6em"))}
                    class={classes["m"]}
                  ></div>
                  <div class={classes["mr"]}></div>
                </div>
                <div class={classes["ss"]}>
                  <div
                    style={time.map(transform(seconds))}
                    class={classes["s"]}
                  ></div>
                  <div class={classes["sr"]}></div>
                </div>
                <div id={classes["k"]}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function seconds(d: number) {
  return (360 * (d % 60000)) / 60000;
}

function minutes(d: number) {
  return (360 * (d % 3600000)) / 3600000;
}

function hours(d: number) {
  return (360 * (d % 43200000)) / 43200000;
}
