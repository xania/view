import { If, List, listSource, ListSource, state } from "@xania/view";
import classes from "./index.module.scss";

export function App() {
  const items = listSource<TodoItem>([
    {
      completed: true,
      label: "Get the milk",
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
  const newTodoText = state("");
  function onNewTodoKeyUp(e: JSX.EventContext<Event, HTMLInputElement>) {
    const label = e.currentTarget.value;
    // if (e.key === "Enter" && label) {
    //   const newItem: TodoItem = {
    //     label,
    //     completed: false
    //   };
    //   props.onNew(newItem);
    //   // newTodoText.select(e.node);
    // }
  }
  return (
    <input
      class={classes["new-todo"]}
      placeholder="What needs to be done?"
      value={newTodoText}
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
          // class={[
          //   editing,
          //   row.map((x) => (x.completed ? "completed" : null)),
          // ]}
          >
            <div class={classes["view"]}>
              <input
                class={classes["toggle"]}
                type="checkbox"
                // checked={row.get("completed")}
                change={(e) =>
                  row.get("completed").update(e.currentTarget.checked)
                }
              />
              <label dblclick={row.update((x) => x)}>{row.get("label")}</label>
              <button class={classes["destroy"]} click={dispose}></button>
            </div>
            <input
              class={classes["edit"]}
              value={row.get("label")}
              blur={editing.update(false)}
              keyup={(evnt) => {
                // if (evnt.key === "Enter") {
                //   evnt.data.label = evnt.currentTarget.value;
                //   items.update(() => [evnt.data]);
                //   editing.clear();
                // } else if (evnt.event.key === "Escape") {
                //   editing.clear();
                // }
              }}
            >
              {/* {editing.attach(focusInput)} */}
              {/* {$((_, { key, node }) =>
              currentEditing.pipe(
                Ro.filter((x) => x === key),
                Ro.map(() => focusInput(node as HTMLInputElement))
              )
            )} */}
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

function focusInput(inputElt: HTMLInputElement) {
  setTimeout(() => {
    inputElt.focus();
    inputElt.setSelectionRange(0, inputElt.value.length);
  });
}
