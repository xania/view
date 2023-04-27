import { Rx } from '../rx';
import { sync } from '../sync';

export interface Task {
  run(): void;
}
export interface TaskScheduler {
  scheduleTask(task: Task): void;
  scheduleState(signal: Rx.Stateful): void;

  flushStates(): void;
  flushTasks(): void;
}

export function scheduleTask(task: Task) {
  if (scheduler) {
    scheduler.scheduleTask(task);
  } else {
    task.run();
  }
}

export function scheduleState(state: Rx.Stateful) {
  if (scheduler) {
    scheduler.scheduleState(state);
  } else {
    sync(state);
  }
}

export function flushStates() {
  if (scheduler) {
    scheduler.flushStates();
  }
}

let scheduler: TaskScheduler | null = null;

export class BatchScheduler implements TaskScheduler {
  tasks: Task[] = [];
  states: Rx.Stateful[] = [];

  scheduleState(state: Rx.Stateful) {
    const { states } = this;
    const root = state;

    for (let i = 0, len = states.length; i < len; i++) {
      if (states[i] === root) {
        return;
      }
    }

    states.push(root);
  }

  scheduleTask(task: Task) {
    const { tasks: queue } = this;
    for (let i = 0, len = queue.length; i < len; i++) {
      if (queue[i] === task) {
        return;
      }
    }
    this.tasks.push(task);
    return;
  }

  flushStates() {
    const { states } = this;
    if (states.length) {
      this.states = [];
      for (let i = 0, len = states.length; i < len; i++) {
        sync(states[i]);
      }
    }
  }

  flushTasks() {
    const { tasks } = this;
    if (tasks.length) {
      for (const task of tasks) {
        task.run();
      }
      tasks.length = 0;
    }
  }
}

// export class AnimationScheduler implements SyncScheduler {
//   states: Rx.Stateful[] = [];
//   private _animationHndl: number = -1;

//   schedule() {
//     const { states } = this;
//     states.push.apply(states, arguments as any);

//     if (this._animationHndl < 0)
//       this._animationHndl = requestAnimationFrame(this.flush);
//   }

//   cancel() {
//     if (this._animationHndl < 0) cancelAnimationFrame(this._animationHndl);
//   }

//   flush = () => {
//     sync(this.states);
//     this._animationHndl = -1;
//   };
// }
