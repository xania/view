import {
  Attachable,
  If,
  List,
  listSource,
  ListSource,
  State,
  state,
} from "@xania/view";
import classes from "./index.module.scss";
import { delay } from "../utils";

export function App() {
  const items = listSource<TodoItem>([
    {
      completed: true,
      label: "Get the milk",
    },
    {
      completed: false,
      label: "Say hi",
    },
  ]);
  return (
    <>
      {/* <Css value="todoapp-container header" /> */}
      <div>(work in progress)</div>
      <section class={classes["todoapp"]}>
        <div>
          <header class={classes["header"]}>
            <h1>todos</h1>
            <NewTodo onNew={(item) => items.push(item)} />
          </header>
          <TodoList items={items} />
          <If condition={items.map((l) => l.length > 0)}>
            <TodoFooter items={items} />
          </If>
        </div>
      </section>
    </>
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
      // newTodoText.select(e.node);
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
  items: ListSource<TodoItem>;
}

function TodoFooter(props: TodoListProps) {
  const { items } = props;

  function all(item: TodoItem) {
    return true;
  }

  function active(item: TodoItem) {
    return item.completed !== true;
  }

  function completed(item: TodoItem) {
    return item.completed === true;
  }

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
          <a class={classes["selected"]} click={items.filter(all)}>
            All
          </a>
        </li>
        <span> </span>
        <li>
          <a click={items.filter(active)}>Active</a>
        </li>
        <span> </span>
        <li>
          <a click={items.filter(completed)}>Completed</a>
        </li>
      </ul>
    </footer>
  );
}

interface TodoListProps {
  items: ListSource<TodoItem>;
}

function TodoList(props: TodoListProps) {
  const { items } = props;
  // const row = useContext<TodoItem>();
  const editing = state(false);

  return (
    <ul class={classes["todo-list"]}>
      <List source={items}>
        {(row, dispose) => (
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
              <button class={classes["destroy"]} click={dispose}></button>
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
      return editing.effect((e) => {
        if (editing && node instanceof HTMLInputElement)
          setTimeout(() => {
            node.focus();
            node.setSelectionRange(0, node.value.length);
          });
      });
    },
  };
}
