import classes from "./index.module.scss";
import { Link, RouteContext, useRouteContext } from "xania/router";
import { Page } from "../layout/page";
import { If, List, State, diff, useState } from "xania";

type Mode = "completed" | "active" | "all";

export function App({}: RouteContext) {
  const routeContext = useRouteContext();

  const items = useState<TodoItem[]>(
    [
      {
        completed: true,
        label: "Get the milk",
      },
      {
        completed: false,
        label: "Say hi",
      },
    ]
    // completed
  );

  const mode = routeContext.events.map((e) => (e.path[0] as Mode) ?? "all");

  return (
    <Page class="flex-auto">
      {/* {mode.map(newMode => {
        switch (newMode) {
          case "completed":
            return [mode.update("completed"), items.filter(completed)];
          case "active":
            return [mode.update("active"), items.filter(active)];
          default:
            return [mode.update("all"), items.filter(all)];
        }
      })} */}
      <section class={classes["todoapp"]}>
        <header class={classes["header"]}>
          <h1>todos</h1>
          <NewTodo
            onNew={(item) => items.update((items) => [...items, item])}
          />

          <input
            id="toggle-all"
            class={classes["toggle-all"]}
            type="checkbox"
            checked={items.map((list) => list.every((todo) => todo.completed))}
            click={(e) =>
              items.update((l) =>
                l.map((item) => ({
                  ...item,
                  completed: e.currentTarget.checked,
                }))
              )
            }
          />
          <label for="toggle-all"></label>
        </header>

        <TodoList items={items} />

        <TodoFooter items={items} mode={mode} />
        {/* <If condition={items.map((l) => l.length > 0)}>-</If> */}
      </section>
    </Page>
  );
}

interface NewTodoProps {
  onNew(x: TodoItem): any;
}

function NewTodo(props: NewTodoProps) {
  function onNewTodoKeyUp(
    e: JSX.EventContext<KeyboardEvent, HTMLInputElement>
  ) {
    const label = e.currentTarget.value;
    if (e.key === "Enter" && label) {
      const newItem: TodoItem = {
        label,
        completed: false,
      };

      e.currentTarget.value = "";
      return [props.onNew(newItem)];
    }
  }
  return (
    <input
      class={classes["new-todo"]}
      placeholder="What needs to be done?"
      keyup={onNewTodoKeyUp}
    />
  );
}

interface TodoListProps {
  items: State<TodoItem[]>;
}

interface TodoFooterProps {
  items: State<TodoItem[]>;
  mode: State<"completed" | "active" | "all">;
}

function TodoFooter(props: TodoFooterProps) {
  const { items, mode } = props;

  return (
    <footer class={classes["footer"]}>
      <span class={classes["todo-count"]}>
        <strong>
          {items.map((l) => {
            const itemsLeft = l.filter((e) => !e.completed).length;
            return itemsLeft === 1 ? "1 item" : `${itemsLeft} items`;
          })}
        </strong>
        <span> left</span>
      </span>
      <ul class={classes["filters"]}>
        <li>
          <a class="border-solid border-2 border-black">
            <Link to={"all"} class={classes["selected"]} />
            All
          </a>
        </li>
        <li>
          <a>
            <Link to={"active"} class={classes["selected"]} />
            Active
          </a>
        </li>
        <li>
          <a>
            <Link to={"completed"} class={classes["selected"]} />
            Completed
          </a>
        </li>
      </ul>
    </footer>
  );
}

function TodoList(props: TodoListProps) {
  const { items } = props;
  const editing = state(false);

  return (
    <ul class={classes["todo-list"]}>
      <List source={items}>
        {(row) => (
          <li
            class={[
              editing.map((x) => (x ? classes["editing"] : null)),
              row.map((x) => (x.completed ? classes["completed"] : null)),
            ]}
          >
            <div class={classes["view"]}>
              <input
                class={classes["toggle"]}
                type="checkbox"
                checked={row.get("completed")}
                change={(e) =>
                  row.get("completed").update(e.currentTarget.checked)
                }
              />
              <label dblclick={editing.update(true)}>{row.get("label")}</label>
              <button
                class={classes["destroy"]}
                // click={dispose}
              ></button>
            </div>
            <input
              class={classes["edit"]}
              value={row.get("label")}
              focusout={editing.update(false)}
              keyup={(evnt) => {
                if (evnt.key === "Enter") {
                  return [
                    editing.update(false),
                    row.get("label").update(evnt.currentTarget.value),
                  ];
                }
              }}
            >
              {focusWhen(editing)}
            </input>
          </li>
        )}
      </List>
    </ul>
  );
}

interface TodoItem {
  label: string;
  completed: boolean;
}

function focusWhen(editing: State<boolean>) {
  return {
    attachTo(node: HTMLInputElement) {
      return editing.effect((editing) => {
        if (editing && node instanceof HTMLInputElement)
          setTimeout(() => {
            node.focus();
            node.setSelectionRange(0, node.value.length);
          });
      });
    },
  };
}

function all(item: TodoItem) {
  return true;
}

function active(item: TodoItem) {
  return item.completed !== true;
}

function completed(item: TodoItem) {
  return item.completed === true;
}
