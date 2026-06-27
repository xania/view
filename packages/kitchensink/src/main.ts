import { If } from "@xania/reactivity/core/if";
import { ForEach } from "@xania/reactivity/core/for";
import { JsonAutomaton } from "@xania/reactivity/json";
import { render } from "@xania/reactivity/render";
import { Sandbox } from "@xania/reactivity/sandbox";
import { useState } from "@xania/reactivity/state";
import type { Lense, State } from "@xania/reactivity/state";
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
  currentCount: number;
  currentVisible: boolean;
  currentTodos: Todo[];
  currentAsyncLabel: string;
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

app.innerHTML = `
  <section class="shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">Xania Reactivity</p>
        <h1>Kitchensink</h1>
      </div>
      <div class="status" id="status">ready</div>
    </header>

    <section class="workspace">
      <aside class="panel controls">
        <div class="control-group">
          <div class="group-head">
            <h2>State</h2>
            <span id="countValue">0</span>
          </div>
          <div class="button-row">
            <button id="decrement" type="button" aria-label="Decrement count">-</button>
            <button id="increment" type="button" aria-label="Increment count">+</button>
          </div>
        </div>

        <div class="control-group">
          <div class="group-head">
            <h2>Conditional</h2>
            <span id="visibleValue">shown</span>
          </div>
          <button id="toggle" type="button">Toggle region</button>
        </div>

        <div class="control-group">
          <div class="group-head">
            <h2>ForEach</h2>
            <span id="todoValue">0 items</span>
          </div>
          <div class="button-row">
            <button id="addTodo" type="button">Add item</button>
            <button id="completeTodo" type="button">Complete first</button>
            <button id="deleteTodo" type="button">Delete first</button>
          </div>
        </div>

        <div class="control-group">
          <div class="group-head">
            <h2>Async</h2>
            <span id="asyncValue">pending</span>
          </div>
          <button id="refreshAsync" type="button">Resolve label</button>
        </div>
      </aside>

      <section class="panel preview-panel">
        <div class="preview-head">
          <h2>Rendered JSON</h2>
          <span id="nodeCount">0 nodes</span>
        </div>
        <pre id="preview"></pre>
      </section>
    </section>
  </section>
`;

const preview = getElement<HTMLPreElement>("preview");
const status = getElement<HTMLDivElement>("status");
const countValue = getElement<HTMLSpanElement>("countValue");
const visibleValue = getElement<HTMLSpanElement>("visibleValue");
const todoValue = getElement<HTMLSpanElement>("todoValue");
const asyncValue = getElement<HTMLSpanElement>("asyncValue");
const nodeCount = getElement<HTMLSpanElement>("nodeCount");

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
    const todos = current.model.currentTodos.slice();
    todos.push({
      id: current.model.nextTodoId,
      title: `Explore ${current.model.nextTodoId}`,
      done: false,
    });
    current.model.nextTodoId += 1;
    current.model.currentTodos = todos;
    lastAction = `todos -> ${todos.length}`;
    rerender(current);
  });

  getElement<HTMLButtonElement>("completeTodo").addEventListener(
    "click",
    () => {
      const todos = current.model.currentTodos.map((todo, index) =>
        index === 0 ? { ...todo, done: !todo.done } : todo,
      );
      current.model.currentTodos = todos;
      lastAction = "toggle first todo";
      rerender(current);
    },
  );

  getElement<HTMLButtonElement>("deleteTodo").addEventListener("click", () => {
    if (current.model.currentTodos.length === 0) {
      return;
    }

    current.model.currentTodos = current.model.currentTodos.slice(1);
    lastAction = "delete first todo";
    rerender(current);
  });

  getElement<HTMLButtonElement>("refreshAsync").addEventListener(
    "click",
    async () => {
      const next = `resolved at ${new Date().toLocaleTimeString()}`;
      lastAction = `asyncLabel -> ${next}`;
      status.textContent = "resolving";
      await current.sandbox.update(
        current.model.asyncLabel,
        Promise.resolve(next),
      );
      current.model.currentAsyncLabel = next;
      status.textContent = "ready";
      paint(current);
    },
  );
}

async function updateCount(current: DemoRuntime, delta: number) {
  const next = current.model.currentCount + delta;
  lastAction = `count -> ${next}`;
  await current.sandbox.update(current.model.count, next);
  current.model.currentCount = next;
  paint(current);
}

async function toggleVisible(current: DemoRuntime) {
  const next = !current.model.currentVisible;
  lastAction = `visible -> ${next}`;
  await current.sandbox.update(current.model.visible, next);
  current.model.currentVisible = next;
  paint(current);
}

function rerender(current: DemoRuntime) {
  status.textContent = "rendering";
  createDemoFromModel(current.model)
    .then((next) => {
      current.root = next.root;
      current.sandbox = next.sandbox;
      current.model = next.model;
      window.__xaniaKitchensink = current;
      status.textContent = "ready";
      paint(current);
    })
    .catch((error) => {
      status.textContent = "failed";
      preview.textContent =
        error instanceof Error ? error.message : String(error);
    });
}

async function createDemoFromModel(model: DemoModel): Promise<DemoRuntime> {
  return createDemoFromValues({
    count: model.currentCount,
    visible: model.currentVisible,
    todos: model.currentTodos,
    asyncLabel: model.currentAsyncLabel,
    nextTodoId: model.nextTodoId,
  });
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
    asyncLabel: useState(Promise.resolve(values.asyncLabel)),
    currentCount: values.count,
    currentVisible: values.visible,
    currentTodos: values.todos,
    currentAsyncLabel: values.asyncLabel,
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
      label: nextModel.asyncLabel,
    },
  ];

  const root: any[] = [];
  const sandbox = await render(view, new JsonAutomaton(root));

  return { root, sandbox, model: nextModel };
}

function paint(current: DemoRuntime) {
  const count = current.model.currentCount;
  const visible = current.model.currentVisible;
  const todos = current.model.currentTodos;
  const asyncLabel = current.model.currentAsyncLabel;

  countValue.textContent = String(count);
  visibleValue.textContent = visible ? "shown" : "hidden";
  todoValue.textContent = `${todos.length} items`;
  asyncValue.textContent = String(asyncLabel);
  nodeCount.textContent = `${countNodes(current.root)} nodes`;
  preview.textContent = JSON.stringify(current.root, null, 2);
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
