import { Task, TaskScheduler } from './scheduler';

export const DefaultTaskScheduler = {
  scheduleTask(task: Task): void {
    console.log(task);
  },
  flush() {},
};
