import { Rx } from './rx';
import { sync } from './sync';
import { popScheduler, pushScheduler } from './write';

export function batch(fn: () => void) {
  const scheduler = new BatchScheduler();
  pushScheduler(scheduler);
  fn();
  popScheduler(scheduler);
  scheduler.flush();
}

class BatchScheduler {
  queue: Rx.Stateful[] = [];
  add(s: Rx.Stateful) {
    this.queue.push(s);
  }
  flush() {
    const { queue } = this;
    for (const x of queue) {
      sync(x);
    }
  }
}
