type BaseShellRefs = {
  status: HTMLDivElement;
  countValue: HTMLSpanElement;
  visibleValue: HTMLSpanElement;
  todoValue: HTMLSpanElement;
  nodeCount: HTMLSpanElement;
};

export type JsonShellRefs = BaseShellRefs & {
  asyncValue: HTMLSpanElement;
  preview: HTMLPreElement;
};

export type DomShellRefs = BaseShellRefs & {
  init: HTMLDivElement;
};

export function renderJsonShell(app: HTMLDivElement): JsonShellRefs {
  const status = div({ className: "status", id: "status" }, "ready");
  const countValue = span({ id: "countValue" }, "0");
  const visibleValue = span({ id: "visibleValue" }, "shown");
  const todoValue = span({ id: "todoValue" }, "0 items");
  const asyncValue = span({ id: "asyncValue" }, "pending");
  const nodeCount = span({ id: "nodeCount" }, "0 nodes");
  const preview = pre({ id: "preview" });

  app.replaceChildren(
    section(
      { className: "shell" },
      createHeader("Kitchensink", "json", status),
      section(
        { className: "workspace" },
        aside(
          { className: "panel controls" },
          createStateControls(countValue),
          createConditionalControls("Toggle region", visibleValue, "toggle"),
          createTodoControls(todoValue, false),
          div(
            { className: "control-group" },
            div(
              { className: "group-head" },
              h2({}, "Async"),
              asyncValue,
            ),
            button({ id: "refreshAsync", type: "button" }, "Resolve label"),
          ),
        ),
        section(
          { className: "panel preview-panel" },
          div(
            { className: "preview-head" },
            h2({}, "Rendered JSON"),
            nodeCount,
          ),
          preview,
        ),
      ),
    ),
  );

  return {
    status,
    countValue,
    visibleValue,
    todoValue,
    asyncValue,
    nodeCount,
    preview,
  };
}

export function renderDomShell(app: HTMLDivElement): DomShellRefs {
  const status = div({ className: "status", id: "status" }, "ready");
  const countValue = span({ id: "countValue" }, "0");
  const visibleValue = span({ id: "visibleValue" }, "shown");
  const todoValue = span({ id: "todoValue" }, "0 items");
  const nodeCount = span({ id: "nodeCount" }, "0 nodes");
  const init = div({ id: "init" });

  app.replaceChildren(
    section(
      { className: "shell" },
      createHeader("DOM Factory", "dom", status),
      section(
        { className: "workspace" },
        aside(
          { className: "panel controls" },
          createStateControls(countValue, true),
          createConditionalControls("Toggle hero", visibleValue, "toggle", true),
          createTodoControls(todoValue, true),
        ),
        section(
          { className: "panel render-panel" },
          div(
            { className: "preview-head" },
            h2({}, "Mounted DOM"),
            nodeCount,
          ),
          div({ className: "render-surface" }, init),
        ),
      ),
    ),
  );

  return {
    status,
    countValue,
    visibleValue,
    todoValue,
    nodeCount,
    init,
  };
}

function createHeader(
  title: string,
  activePage: "json" | "dom",
  status: HTMLDivElement,
) {
  return header(
    { className: "topbar" },
    div({}, p({ className: "eyebrow" }, "Xania Reactivity"), h1({}, title)),
    nav(
      { className: "topnav", "aria-label": "Kitchen pages" },
      a(
        {
          className: activePage === "json" ? "navlink active" : "navlink",
          href: "/index.html",
        },
        "JSON Preview",
      ),
      a(
        {
          className: activePage === "dom" ? "navlink active" : "navlink",
          href: "/dom.html",
        },
        "DOM Factory",
      ),
    ),
    status,
  );
}

function createStateControls(
  countValue: HTMLSpanElement,
  delegated = false,
) {
  return div(
    { className: "control-group" },
    div({ className: "group-head" }, h2({}, "State"), countValue),
    div(
      { className: "button-row" },
      button(
        delegated
          ? { "data-control-action": "decrement", type: "button" }
          : {
              id: "decrement",
              type: "button",
              "aria-label": "Decrement count",
            },
        "-",
      ),
      button(
        delegated
          ? { "data-control-action": "increment", type: "button" }
          : {
              id: "increment",
              type: "button",
              "aria-label": "Increment count",
            },
        "+",
      ),
    ),
  );
}

function createConditionalControls(
  label: string,
  visibleValue: HTMLSpanElement,
  action: string,
  delegated = false,
) {
  return div(
    { className: "control-group" },
    div({ className: "group-head" }, h2({}, "Conditional"), visibleValue),
    button(
      delegated
        ? { "data-control-action": action, type: "button" }
        : { id: action, type: "button" },
      label,
    ),
  );
}

function createTodoControls(
  todoValue: HTMLSpanElement,
  delegated: boolean,
) {
  const buttons = delegated
    ? [
        button({ "data-control-action": "addTodo", type: "button" }, "Add item"),
        button(
          { "data-control-action": "completeTodo", type: "button" },
          "Toggle first",
        ),
        button(
          { "data-control-action": "markDoneTodo", type: "button" },
          "Mark first done",
        ),
        button(
          { "data-control-action": "deleteTodo", type: "button" },
          "Delete first",
        ),
      ]
    : [
        button({ id: "addTodo", type: "button" }, "Add item"),
        button({ id: "completeTodo", type: "button" }, "Complete first"),
        button({ id: "deleteTodo", type: "button" }, "Delete first"),
      ];

  return div(
    { className: "control-group" },
    div({ className: "group-head" }, h2({}, "ForEach"), todoValue),
    div({ className: "button-row" }, ...buttons),
  );
}

function setAttributes(
  element: HTMLElement,
  props: Record<string, string | undefined>,
) {
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) {
      continue;
    }

    if (key === "className") {
      element.className = value;
      continue;
    }

    element.setAttribute(key, value);
  }
}

function appendChildren(element: HTMLElement, children: Child[]) {
  for (const child of children) {
    if (typeof child === "string") {
      element.append(child);
    } else {
      element.append(child);
    }
  }
  return element;
}

type Child = HTMLElement | string;

function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  props: Record<string, string | undefined>,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  setAttributes(element, props);
  return appendChildren(element, children) as HTMLElementTagNameMap[K];
}

function a(props: Record<string, string | undefined>, ...children: Child[]) {
  return createElement("a", props, ...children);
}

function aside(props: Record<string, string | undefined>, ...children: Child[]) {
  return createElement("aside", props, ...children);
}

function button(
  props: Record<string, string | undefined>,
  ...children: Child[]
) {
  return createElement("button", props, ...children);
}

function div(props: Record<string, string | undefined>, ...children: Child[]) {
  return createElement("div", props, ...children);
}

function h1(props: Record<string, string | undefined>, ...children: Child[]) {
  return createElement("h1", props, ...children);
}

function h2(props: Record<string, string | undefined>, ...children: Child[]) {
  return createElement("h2", props, ...children);
}

function header(
  props: Record<string, string | undefined>,
  ...children: Child[]
) {
  return createElement("header", props, ...children);
}

function nav(props: Record<string, string | undefined>, ...children: Child[]) {
  return createElement("nav", props, ...children);
}

function p(props: Record<string, string | undefined>, ...children: Child[]) {
  return createElement("p", props, ...children);
}

function pre(props: Record<string, string | undefined>, ...children: Child[]) {
  return createElement("pre", props, ...children);
}

function section(
  props: Record<string, string | undefined>,
  ...children: Child[]
) {
  return createElement("section", props, ...children);
}

function span(props: Record<string, string | undefined>, ...children: Child[]) {
  return createElement("span", props, ...children);
}
