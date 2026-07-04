import { If } from "@xania/reactivity/core/if";
import { ForEach } from "@xania/reactivity/core/for";
import { UpdateCommand } from "@xania/reactivity/commands/update";
import { events, JsonAutomaton } from "@xania/reactivity/json-automaton";
import { render } from "@xania/reactivity/render";
import { Sandbox } from "@xania/reactivity/sandbox";
import { useState } from "@xania/reactivity/state";
import type { Lense, State } from "@xania/reactivity/state";
import { renderJsonShell } from "./shell";
import "./styles.css";

type Todo = {
  id: number;
  title: string;
  done: boolean;
};

type DemoModel = {
  count: State<number>;
  visible: State<boolean>;
  todos: State<Todo[]>;
  asyncLabel: State<string>;
  nextTodoId: number;
};

type DemoRuntime = {
  root: any[];
  sandbox: Sandbox;
  model: DemoModel;
};

declare global {
  interface Window {
    __xaniaKitchensink?: DemoRuntime;
  }
}

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root was not found");
}

const { preview, status, countValue, visibleValue, todoValue, asyncValue, nodeCount } =
  renderJsonShell(app);

let runtime: DemoRuntime;
let lastAction = "initial render";

createDemo()
  .then((created) => {
    runtime = created;
    window.__xaniaKitchensink = runtime;
    bindControls(runtime);
    paint(runtime);
  })
  .catch((error) => {
    status.textContent = "failed";
    preview.textContent =
      error instanceof Error ? (error.stack ?? error.message) : String(error);
  });

async function createDemo(): Promise<DemoRuntime> {
  return createDemoFromValues({
    count: 2,
    visible: true,
    todos: [
      { id: 1, title: "Wire state", done: true },
      { id: 2, title: "Render templates", done: false },
    ],
    asyncLabel: "loaded from promise",
    nextTodoId: 3,
  });
}

function bindControls(current: DemoRuntime) {
  getElement<HTMLButtonElement>("increment").addEventListener("click", () => {
    void updateCount(current, 1);
  });

  getElement<HTMLButtonElement>("decrement").addEventListener("click", () => {
    void updateCount(current, -1);
  });

  getElement<HTMLButtonElement>("toggle").addEventListener("click", () => {
    void toggleVisible(current);
  });

  getElement<HTMLButtonElement>("addTodo").addEventListener("click", () => {
    const nextTodoId = current.model.nextTodoId;
    current.model.nextTodoId += 1;
    lastAction = `todos -> add #${nextTodoId}`;
    const result = current.sandbox.dispatchEvent(
      {
        [events]: {
          click: new UpdateCommand(current.model.todos, (todos) => [
            ...todos,
            {
              id: nextTodoId,
              title: `Explore ${nextTodoId}`,
              done: false,
            },
          ]),
        },
      },
      "click",
    );
    void Promise.resolve(result).then(() => paint(current));
  });

  getElement<HTMLButtonElement>("completeTodo").addEventListener(
    "click",
    () => {
      lastAction = "toggle first todo";
      const result = current.sandbox.dispatchEvent(
        {
          [events]: {
            click: new UpdateCommand(current.model.todos, (todos) =>
              todos.map((todo, index) =>
                index === 0 ? { ...todo, done: !todo.done } : todo,
              ),
            ),
          },
        },
        "click",
      );
      void Promise.resolve(result).then(() => paint(current));
    },
  );

  getElement<HTMLButtonElement>("deleteTodo").addEventListener("click", () => {
    if (readState(current, current.model.todos).length === 0) {
      return;
    }

    lastAction = "delete first todo";
    const result = current.sandbox.dispatchEvent(
      {
        [events]: {
          click: new UpdateCommand(current.model.todos, (todos) =>
            todos.slice(1),
          ),
        },
      },
      "click",
    );
    void Promise.resolve(result).then(() => paint(current));
  });

  getElement<HTMLButtonElement>("refreshAsync").addEventListener(
    "click",
    async () => {
      const next = `resolved at ${new Date().toLocaleTimeString()}`;
      lastAction = `asyncLabel -> ${next}`;
      status.textContent = "resolving";
      await Promise.resolve(
        current.sandbox.dispatchEvent(
          {
            [events]: {
              click: new UpdateCommand(current.model.asyncLabel, () =>
                Promise.resolve(next),
              ),
            },
          },
          "click",
        ),
      );
      status.textContent = "ready";
      paint(current);
    },
  );
}

async function updateCount(current: DemoRuntime, delta: number) {
  lastAction = `count ${delta > 0 ? "+" : ""}${delta}`;
  await Promise.resolve(
    current.sandbox.dispatchEvent(
      {
        [events]: {
          click: new UpdateCommand(current.model.count, (count) => count + delta),
        },
      },
      "click",
    ),
  );
  paint(current);
}

async function toggleVisible(current: DemoRuntime) {
  lastAction = "visible -> toggle";
  await Promise.resolve(
    current.sandbox.dispatchEvent(
      {
        [events]: {
          click: new UpdateCommand(current.model.visible, (visible) => !visible),
        },
      },
      "click",
    ),
  );
  paint(current);
}

type DemoValues = {
  count: number;
  visible: boolean;
  todos: Todo[];
  asyncLabel: string;
  nextTodoId: number;
};

async function createDemoFromValues(values: DemoValues): Promise<DemoRuntime> {
  const nextModel: DemoModel = {
    count: useState(values.count),
    visible: useState(values.visible),
    todos: useState(values.todos),
    asyncLabel: useState(values.asyncLabel),
    nextTodoId: values.nextTodoId,
  };

  const doubled = nextModel.count.map((value: number) => value * 2);
  const summary = nextModel.count.map((value: number) => `count:${value}`);
  const completeCount = nextModel.todos.map(
    (items: Todo[]) => items.filter((item: Todo) => item.done).length,
  );

  const view = [
    {
      feature: "state",
      count: nextModel.count,
      doubled,
      summary,
    },
    {
      feature: "conditional",
      visible: nextModel.visible,
      body: [
        If(nextModel.visible, [
          "visible",
          {
            count: nextModel.count,
            completed: completeCount,
          },
        ]),
      ],
    },
    {
      feature: "foreach",
      items: [
        ForEach(nextModel.todos, (todo: Lense<Todo>) => {
          const todoState = todo;

          return {
            id: todoState.map((item: Todo) => item.id),
            title: todoState.map((item: Todo) => item.title),
            titleAsync: todoState.map((item: Todo) =>
              Promise.resolve(item.title.toUpperCase()),
            ),
            done: todoState.map((item: Todo) => item.done),
            labels: todoState.map((item: Todo) => [
              item.done ? "complete" : "open",
              `#${item.id}`,
            ]),
          };
        }),
      ],
    },
    {
      feature: "async",
      label: nextModel.asyncLabel.map((value: string) =>
        Promise.resolve(value),
      ),
    },
  ];

  const root: any[] = [];
  const sandbox = await render(view, new JsonAutomaton(root));

  return { root, sandbox, model: nextModel };
}

function paint(current: DemoRuntime) {
  const count = readState(current, current.model.count);
  const visible = readState(current, current.model.visible);
  const todos = readState(current, current.model.todos);
  const asyncLabel = readState(current, current.model.asyncLabel);

  countValue.textContent = String(count);
  visibleValue.textContent = visible ? "shown" : "hidden";
  todoValue.textContent = `${todos.length} items`;
  asyncValue.textContent = String(asyncLabel);
  nodeCount.textContent = `${countNodes(current.root)} nodes`;
  preview.textContent = JSON.stringify(current.root, null, 2);
}

function readState<T>(current: DemoRuntime, state: State<T>): T {
  return (current.sandbox.rootValues[state.key] ?? state.initial) as T;
}

function countNodes(value: unknown): number {
  if (value instanceof Array) {
    return 1 + value.reduce((sum, item) => sum + countNodes(item), 0);
  }

  if (value && typeof value === "object") {
    return (
      1 +
      Object.values(value as Record<string, unknown>).reduce<number>(
        (sum, item) => sum + countNodes(item),
        0,
      )
    );
  }

  return 1;
}

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }
  return element as T;
}
