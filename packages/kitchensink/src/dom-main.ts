import { If } from "@xania/reactivity/core/if";
import { ForEach } from "@xania/reactivity/core/for";
import {
  events as objectEvents,
  type as objectType,
  children as objectChildren,
} from "@xania/reactivity/json-automaton";
import { UpdateCommand, update } from "@xania/reactivity/commands/update";
import { render } from "@xania/reactivity/render";
import { Sandbox } from "@xania/reactivity/sandbox";
import { useState } from "@xania/reactivity/state";
import type { Lense, State } from "@xania/reactivity/state";
import { DomAutomaton } from "@xania/web";
import { renderDomShell } from "./shell";
import "./styles.css";

type Todo = {
  id: number;
  title: string;
  done: boolean;
};

type DomRuntime = {
  sandbox: Sandbox;
  model: DomModel;
};

type DomModel = {
  count: State<number>;
  visible: State<boolean>;
  todos: State<Todo[]>;
  nextTodoId: number;
};

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root was not found");
}

const { init, status, countValue, visibleValue, todoValue, nodeCount } =
  renderDomShell(app);

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

async function updateCount(current: DomRuntime, delta: number) {
  status.textContent = "updating";
  await Promise.resolve(
    current.sandbox.dispatchEvent(
      {
        [objectEvents]: {
          click: new UpdateCommand(
            current.model.count,
            (count) => count + delta,
          ),
        },
      },
      "click",
    ),
  );
  paint(current);
}

async function updateVisible(current: DomRuntime) {
  status.textContent = "updating";
  await Promise.resolve(
    current.sandbox.dispatchEvent(
      {
        [objectEvents]: {
          click: new UpdateCommand(
            current.model.visible,
            (visible) => !visible,
          ),
        },
      },
      "click",
    ),
  );
  paint(current);
}

async function updateTodos(
  current: DomRuntime,
  update: (todos: Todo[]) => Todo[],
) {
  status.textContent = "updating";
  await Promise.resolve(
    current.sandbox.dispatchEvent(
      {
        [objectEvents]: {
          click: new UpdateCommand(current.model.todos, update),
        },
      },
      "click",
    ),
  );
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
        h("p", { class: "eyebrow" }, "WebAutomaton"),
        h("h2", {}, "Typed Objects Become Real DOM"),
        h(
          "p",
          {},
          "This page renders directly into the browser DOM through WebAutomaton.",
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
        "div",
        { class: "todo-item-actions" },
        h(
          "button",
          {
            class: "todo-inline-button",
            [objectEvents]: {
              click: new UpdateCommand(model.count, 7),
            },
          },
          "Set count to 7",
        ),
        h(
          "button",
          {
            class: "todo-inline-button",
            [objectEvents]: {
              click: new UpdateCommand(model.visible, false),
            },
          },
          "Hide hero",
        ),
      ),
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

                      return update(runtime.model.todos, (todos) =>
                        todos.map((todo) =>
                          todo.id === todoId
                            ? { ...todo, done: !todo.done }
                            : todo,
                        ),
                      );
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

  const sandbox = await render(view, new DomAutomaton(init));

  return { sandbox, model };
}

function bindControls(current: DomRuntime) {
  document.body.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const control = target.closest("[data-control-action]");
    if (!(control instanceof HTMLElement)) {
      return;
    }

    const action = control.dataset.controlAction;
    switch (action) {
      case "increment":
        void updateCount(current, 1);
        break;
      case "decrement":
        void updateCount(current, -1);
        break;
      case "toggle":
        void updateVisible(current);
        break;
      case "addTodo": {
        const nextTodoId = current.model.nextTodoId;
        current.model.nextTodoId += 1;
        void updateTodos(current, (todos) => [
          ...todos,
          {
            id: nextTodoId,
            title: `Inspect node ${nextTodoId}`,
            done: false,
          },
        ]);
        break;
      }
      case "completeTodo": {
        void updateTodos(current, (todos) =>
          todos.map((todo, index) =>
            index === 0 ? { ...todo, done: !todo.done } : todo,
          ),
        );
        break;
      }
      case "markDoneTodo": {
        void updateTodos(current, (todos) =>
          todos.map((todo, index) =>
            index === 0 ? { ...todo, done: true } : todo,
          ),
        );
        break;
      }
      case "deleteTodo":
        if (readState(current, current.model.todos).length > 0) {
          void updateTodos(current, (todos) => todos.slice(1));
        }
        break;
    }
  });
}

function paint(current: DomRuntime) {
  const count = readState(current, current.model.count);
  const visible = readState(current, current.model.visible);
  const todos = readState(current, current.model.todos);

  countValue.textContent = String(count);
  visibleValue.textContent = visible ? "shown" : "hidden";
  todoValue.textContent = `${todos.length} items`;
  nodeCount.textContent = `${countNodes(init)} nodes`;
  status.textContent = "ready";
}

function h(
  nodeType: string,
  props: Record<string, unknown>,
  ...children: unknown[]
) {
  return {
    [objectType]: nodeType,
    [objectChildren]: children,
    ...props,
  };
}
function readState<T>(current: DomRuntime, state: State<T>): T {
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
