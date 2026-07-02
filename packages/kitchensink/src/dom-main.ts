import { If } from "@xania/reactivity/core/if";
import { ForEach } from "@xania/reactivity/core/for";
import {
  type AutomatonObject,
  events as objectEvents,
  JsonAutomaton,
  domObjectFactory,
  type as objectType,
} from "@xania/reactivity/json-automaton";
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

type DomRuntime = {
  root: any[];
  sandbox: Sandbox;
  model: DomModel;
};

type DomModel = {
  count: State<number>;
  visible: State<boolean>;
  todos: State<Todo[]>;
  countValue: number;
  visibleValue: boolean;
  todosValue: Todo[];
  nextTodoId: number;
};

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root was not found");
}

app.innerHTML = `
  <section class="shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">Xania Reactivity</p>
        <h1>DOM Factory</h1>
      </div>
      <nav class="topnav" aria-label="Kitchen pages">
        <a class="navlink" href="/index.html">JSON Preview</a>
        <a class="navlink active" href="/dom.html">DOM Factory</a>
      </nav>
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
            <button id="decrement" type="button">-</button>
            <button id="increment" type="button">+</button>
          </div>
        </div>

        <div class="control-group">
          <div class="group-head">
            <h2>Conditional</h2>
            <span id="visibleValue">shown</span>
          </div>
          <button id="toggle" type="button">Toggle hero</button>
        </div>

        <div class="control-group">
          <div class="group-head">
            <h2>ForEach</h2>
            <span id="todoValue">0 items</span>
          </div>
          <div class="button-row">
            <button id="addTodo" type="button">Add item</button>
            <button id="completeTodo" type="button">Toggle first</button>
            <button id="markDoneTodo" type="button">Mark first done</button>
            <button id="deleteTodo" type="button">Delete first</button>
          </div>
        </div>
      </aside>

      <section class="panel render-panel">
        <div class="preview-head">
          <h2>Mounted DOM</h2>
          <span id="nodeCount">0 nodes</span>
        </div>
        <div class="render-surface">
          <div id="init"></div>
        </div>
      </section>
    </section>
  </section>
`;

const init = getElement<HTMLDivElement>("init");
const status = getElement<HTMLDivElement>("status");
const countValue = getElement<HTMLSpanElement>("countValue");
const visibleValue = getElement<HTMLSpanElement>("visibleValue");
const todoValue = getElement<HTMLSpanElement>("todoValue");
const nodeCount = getElement<HTMLSpanElement>("nodeCount");

let runtime: DomRuntime;

createRuntime()
  .then((created) => {
    runtime = created;
    bindControls(runtime);
    paint(runtime);
  })
  .catch((error) => {
    status.textContent = "failed";
    init.replaceChildren(
      document.createTextNode(
        error instanceof Error ? (error.stack ?? error.message) : String(error),
      ),
    );
  });

async function createRuntime(): Promise<DomRuntime> {
  return createRuntimeFromValues({
    count: 2,
    visible: true,
    todos: [
      { id: 1, title: "Init real nodes", done: true },
      { id: 2, title: "Drive them from JSON", done: false },
    ],
    nextTodoId: 3,
  });
}

function bindControls(current: DomRuntime) {
  getElement<HTMLButtonElement>("increment").addEventListener("click", () => {
    void updateCount(current, 1);
  });

  getElement<HTMLButtonElement>("decrement").addEventListener("click", () => {
    void updateCount(current, -1);
  });

  getElement<HTMLButtonElement>("toggle").addEventListener("click", () => {
    void updateVisible(current);
  });

  getElement<HTMLButtonElement>("addTodo").addEventListener("click", () => {
    const todos = current.model.todosValue.slice();
    todos.push({
      id: current.model.nextTodoId,
      title: `Inspect node ${current.model.nextTodoId}`,
      done: false,
    });
    current.model.nextTodoId += 1;
    void updateTodos(current, todos);
  });

  getElement<HTMLButtonElement>("completeTodo").addEventListener(
    "click",
    () => {
      const todos = current.model.todosValue.map((todo, index) =>
        index === 0 ? { ...todo, done: !todo.done } : todo,
      );
      void updateTodos(current, todos);
    },
  );

  getElement<HTMLButtonElement>("markDoneTodo").addEventListener(
    "click",
    () => {
      const todos = current.model.todosValue.map((todo, index) =>
        index === 0 ? { ...todo, done: true } : todo,
      );
      void updateTodos(current, todos);
    },
  );

  getElement<HTMLButtonElement>("deleteTodo").addEventListener("click", () => {
    if (current.model.todosValue.length === 0) {
      return;
    }

    void updateTodos(current, current.model.todosValue.slice(1));
  });
}

async function updateCount(current: DomRuntime, delta: number) {
  const next = current.model.countValue + delta;
  status.textContent = "updating";
  await current.sandbox.update(current.model.count, next);
  current.model.countValue = next;
  paint(current);
}

async function updateVisible(current: DomRuntime) {
  const next = !current.model.visibleValue;
  status.textContent = "updating";
  await current.sandbox.update(current.model.visible, next);
  current.model.visibleValue = next;
  paint(current);
}

async function updateTodos(current: DomRuntime, todos: Todo[]) {
  status.textContent = "updating";
  await current.sandbox.update(current.model.todos, todos);
  current.model.todosValue = todos;
  paint(current);
}

async function createRuntimeFromValues(values: {
  count: number;
  visible: boolean;
  todos: Todo[];
  nextTodoId: number;
}): Promise<DomRuntime> {
  const model: DomModel = {
    count: useState(values.count),
    visible: useState(values.visible),
    todos: useState(values.todos),
    countValue: values.count,
    visibleValue: values.visible,
    todosValue: values.todos,
    nextTodoId: values.nextTodoId,
  };

  const doubled = model.count.map((value: number) => value * 2);
  const openCount = model.todos.map(
    (todos: Todo[]) => todos.filter((todo: Todo) => !todo.done).length,
  );

  const view = h(
    "section",
    { class: "dom-output" },
    If(
      model.visible,
      h(
        "article",
        { class: "hero-card" },
        h("p", { class: "eyebrow" }, "domObjectFactory"),
        h("h2", {}, "Typed Objects Become Real DOM"),
        h(
          "p",
          {},
          "This page renders through JsonAutomaton, then initializes the resulting DOM-shaped object tree in the browser.",
        ),
        h(
          "div",
          { class: "metric-row" },
          h(
            "div",
            { class: "metric" },
            h("span", { class: "metric-label" }, "Count"),
            h("strong", { class: "metric-value" }, model.count),
          ),
          h(
            "div",
            { class: "metric" },
            h("span", { class: "metric-label" }, "Doubled"),
            h("strong", { class: "metric-value" }, doubled),
          ),
          h(
            "div",
            { class: "metric" },
            h("span", { class: "metric-label" }, "Open Todos"),
            h("strong", { class: "metric-value" }, openCount),
          ),
        ),
      ),
    ),
    h(
      "article",
      { class: "todo-card" },
      h("h3", {}, "Todo Output"),
      h(
        "p",
        { class: "empty-state" },
        "Delete down to zero to verify the list reconciles cleanly.",
      ),
      h(
        "ul",
        { class: "todo-list" },
        ForEach(model.todos, (todo: Lense<Todo>) =>
          h(
            "li",
            {
              class: todo.map((item: Todo) =>
                item.done ? "todo-item done" : "todo-item",
              ),
            },
            h(
              "span",
              {},
              todo.map((item: Todo) => item.title),
            ),
            h(
              "div",
              { class: "todo-item-actions" },
              h(
                "span",
                { class: "todo-badge" },
                todo.map((item: Todo) => (item.done ? "done" : "open")),
              ),
              h(
                "button",
                {
                  class: "todo-inline-button",
                  "data-todo-id": todo.map((item: Todo) => item.id),
                  [objectEvents]: {
                    click(this: Record<string, unknown>) {
                      if (!runtime) {
                        return;
                      }

                      const todoId = Number(this["data-todo-id"]);
                      if (!Number.isFinite(todoId)) {
                        return;
                      }

                      const todos = runtime.model.todosValue.map((todo) =>
                        todo.id === todoId
                          ? { ...todo, done: !todo.done }
                          : todo,
                      );

                      void updateTodos(runtime, todos);
                    },
                  },
                },
                todo.map((item: Todo) =>
                  item.done ? "Mark open" : "Mark done",
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );

  const root: any[] = [];
  const sandbox = await render(
    view,
    new JsonAutomaton(root, undefined, domObjectFactory),
  );

  return { root, sandbox, model };
}

function paint(current: DomRuntime) {
  countValue.textContent = String(current.model.countValue);
  visibleValue.textContent = current.model.visibleValue ? "shown" : "hidden";
  todoValue.textContent = `${current.model.todosValue.length} items`;
  nodeCount.textContent = `${countNodes(current.root)} nodes`;

  init.replaceChildren(...materializeChildren(current.root));
  status.textContent = "ready";
}

function h(
  nodeType: string,
  props: Record<string, unknown>,
  ...children: unknown[]
) {
  return {
    [objectType]: nodeType,
    ...props,
    children,
  };
}

function materializeChildren(value: unknown): Node[] {
  if (value instanceof Array) {
    return value.flatMap((item) => materializeChildren(item));
  }

  if (value === null || value === undefined) {
    return [];
  }

  if (typeof value === "string" || typeof value === "number") {
    return [document.createTextNode(String(value))];
  }

  if (typeof value === "object") {
    const record = value as AutomatonObject;
    if (typeof record.type === "string") {
      const element = document.createElement(record.type);
      const eventMap = record[objectEvents] as
        | Record<string, (this: Record<string, unknown>, event: Event) => void>
        | undefined;

      for (const [key, propValue] of Object.entries(record)) {
        if (key === "type" || key === "children") {
          continue;
        }

        if (
          propValue === false ||
          propValue === null ||
          propValue === undefined
        ) {
          continue;
        }

        if (propValue === true) {
          element.setAttribute(key, "");
          continue;
        }

        const attrName = key === "className" ? "class" : key;
        element.setAttribute(attrName, String(propValue));
      }

      if (eventMap) {
        for (const [eventName, handler] of Object.entries(eventMap)) {
          element.addEventListener(eventName, (event) =>
            handler.call(record, event),
          );
        }
      }

      element.append(...materializeChildren(record.children ?? []));
      return [element];
    }

    return [document.createTextNode(JSON.stringify(record))];
  }

  return [document.createTextNode(String(value))];
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
