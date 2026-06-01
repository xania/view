import { If } from '@xania/reactivity/core/if';
import { ForEach } from '@xania/reactivity/core/for';
import { JsonAutomaton } from '@xania/reactivity/json';
import { render } from '@xania/reactivity/render';
import { Sandbox } from '@xania/reactivity/sandbox';
import { State, useState } from '@xania/reactivity/state';
import './styles.css';

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

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root was not found');
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

const preview = getElement<HTMLPreElement>('preview');
const status = getElement<HTMLDivElement>('status');
const countValue = getElement<HTMLSpanElement>('countValue');
const visibleValue = getElement<HTMLSpanElement>('visibleValue');
const todoValue = getElement<HTMLSpanElement>('todoValue');
const asyncValue = getElement<HTMLSpanElement>('asyncValue');
const nodeCount = getElement<HTMLSpanElement>('nodeCount');

let runtime: DemoRuntime;

createDemo()
  .then((created) => {
    runtime = created;
    bindControls(runtime);
    paint(runtime);
  })
  .catch((error) => {
    status.textContent = 'failed';
    preview.textContent = error instanceof Error ? error.stack ?? error.message : String(error);
  });

async function createDemo(): Promise<DemoRuntime> {
  const model: DemoModel = {
    count: useState(2),
    visible: useState(true),
    todos: useState([
      { id: 1, title: 'Wire state', done: true },
      { id: 2, title: 'Render templates', done: false },
    ]),
    asyncLabel: useState(Promise.resolve('loaded from promise')),
    nextTodoId: 3,
  };

  const doubled = model.count.map((value) => value * 2);
  const summary = model.count.map((value) => `count:${value}`);

  const view = [
    {
      feature: 'state',
      count: model.count,
      doubled,
      summary,
    },
    If(model.visible, {
      feature: 'conditional',
      body: ['visible', model.count],
    }),
    {
      feature: 'foreach',
      items: [ForEach(model.todos, (todo) => ({
        title: todo.map((item) => item.title),
        done: todo.map((item) => item.done),
      }))],
    },
    {
      feature: 'async',
      label: model.asyncLabel,
    },
  ];

  const root: any[] = [];
  const sandbox = await render(view, new JsonAutomaton(root));

  return { root, sandbox, model };
}

function bindControls(current: DemoRuntime) {
  getElement<HTMLButtonElement>('increment').addEventListener('click', () => {
    updateCount(current, 1);
  });

  getElement<HTMLButtonElement>('decrement').addEventListener('click', () => {
    updateCount(current, -1);
  });

  getElement<HTMLButtonElement>('toggle').addEventListener('click', () => {
    const next = !current.model.visible.initial;
    current.model.visible = useState(next);
    rerender(current);
  });

  getElement<HTMLButtonElement>('addTodo').addEventListener('click', () => {
    const todos = current.model.todos.initial.slice();
    todos.push({
      id: current.model.nextTodoId,
      title: `Explore ${current.model.nextTodoId}`,
      done: false,
    });
    current.model.nextTodoId += 1;
    current.model.todos = useState(todos);
    rerender(current);
  });

  getElement<HTMLButtonElement>('completeTodo').addEventListener('click', () => {
    const todos = current.model.todos.initial.map((todo, index) =>
      index === 0 ? { ...todo, done: !todo.done } : todo
    );
    current.model.todos = useState(todos);
    rerender(current);
  });

  getElement<HTMLButtonElement>('refreshAsync').addEventListener('click', async () => {
    status.textContent = 'resolving';
    await current.sandbox.update(
      current.model.asyncLabel,
      Promise.resolve(`resolved at ${new Date().toLocaleTimeString()}`)
    );
    status.textContent = 'ready';
    paint(current);
  });
}

function updateCount(current: DemoRuntime, delta: number) {
  const next = current.model.count.initial + delta;
  current.model.count = useState(next);
  rerender(current);
}

function rerender(current: DemoRuntime) {
  createDemoFromModel(current.model)
    .then((next) => {
      current.root = next.root;
      current.sandbox = next.sandbox;
      current.model = next.model;
      paint(current);
    })
    .catch((error) => {
      status.textContent = 'failed';
      preview.textContent = error instanceof Error ? error.message : String(error);
    });
}

async function createDemoFromModel(model: DemoModel): Promise<DemoRuntime> {
  const nextModel: DemoModel = {
    ...model,
    count: useState(model.count.initial),
    visible: useState(model.visible.initial),
    todos: useState(model.todos.initial),
    asyncLabel: useState(model.asyncLabel.initial),
  };

  const doubled = nextModel.count.map((value) => value * 2);
  const summary = nextModel.count.map((value) => `count:${value}`);

  const view = [
    {
      feature: 'state',
      count: nextModel.count,
      doubled,
      summary,
    },
    If(nextModel.visible, {
      feature: 'conditional',
      body: ['visible', nextModel.count],
    }),
    {
      feature: 'foreach',
      items: [ForEach(nextModel.todos, (todo) => ({
        title: todo.map((item) => item.title),
        done: todo.map((item) => item.done),
      }))],
    },
    {
      feature: 'async',
      label: nextModel.asyncLabel,
    },
  ];

  const root: any[] = [];
  const sandbox = await render(view, new JsonAutomaton(root));

  return { root, sandbox, model: nextModel };
}

function paint(current: DemoRuntime) {
  const count = current.model.count.initial;
  const visible = current.model.visible.initial;
  const todos = current.model.todos.initial;
  const asyncLabel = current.root[3]?.label ?? 'pending';

  countValue.textContent = String(count);
  visibleValue.textContent = visible ? 'shown' : 'hidden';
  todoValue.textContent = `${todos.length} items`;
  asyncValue.textContent = String(asyncLabel);
  nodeCount.textContent = `${countNodes(current.root)} nodes`;
  preview.textContent = JSON.stringify(current.root, null, 2);
}

function countNodes(value: unknown): number {
  if (value instanceof Array) {
    return 1 + value.reduce((sum, item) => sum + countNodes(item), 0);
  }

  if (value && typeof value === 'object') {
    return (
      1 +
      Object.values(value as Record<string, unknown>).reduce(
        (sum, item) => sum + countNodes(item),
        0
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
