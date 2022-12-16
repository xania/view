# @xania/view

Xania (package name '@xania/view') is a JavaScript view library for building user interfaces

#### Goal

Goal of _Xania_ is to 'fix' React. Keep using the good parts (JSX is king, unidirectional data flow) but prevent issues (stale closures) from happening so that we don't have to solve them.

Also, goal is to proof simple design is the best design:

- supports all primitives of the platform
- easy to understand and intuitive (for you to judge)
- being the fastest, literally (see [benchmark](https://krausest.github.io/js-framework-benchmark/2022/table_chrome_104_windows.html))

## Starting new project

```powershell
npm init @xania/app hello-world
```

```powershell
cd hello-world
npm start

VITE v3.2.4  ready in 150 ms
➜  Local:   http://localhost:3000/
```

## Existing project

1. install package

```powershell
npm i @xania/view
```

2. add jsx support through configuration in tsconfig.json

```json
/** /tsconfig.json */
{
  "compilerOptions": {
    ...
    "jsxFactory": "jsx.createElement",
    "jsx": "react",
    "jsxFragmentFactory": "jsx.createFragment",
    "typeRoots" : ["@xania/view/types"]
  }
}
```

3. Create components using the jsx syntax

```typescript
/* time.tsx */
import { jsxFactory } from "@xania/view"
const jsx = jsxFactory(/** factory options **/);

export function Time() {
  const state = useState("");
  setInterval(_ => state.update(new Date().toLocalTimeString(); ), 1000);
  return state;
}

```

4. Render to HTML

```typescript
/* app.tsx */
import { render } from '@xania/view';
import Time from './time';

render(<Time />, document.body);
```

### How is _Xania_ better than _React_?

##### 1. _Xania_ solves common issues.

Most of the issues in React are caused by the re-rendering of the component on state change. All these hooks have cascading issues, it's funny that some hooks are introduced to mitigate issues from other hooks and in the process introduce new issues.

- ~~useEffect~~
- ~~useCallback~~
- ~~useMemo~~
- ~~useRef~~
- ~~use~~
- ~~cache~~
- ...

So how can _Xania_ update the view without re-rendering? The solution is examined by _Xania_ is fine-grained reactivity and binding to state objects and observables.

##### 2. _Xania_ uses the platform

First class support for

- async/await
- promises
- observables (any object that implements `subscribe`)
- async iterators (design phase, see question)
- arrays (just like React)

Javascript is expressive and is getting better. While async/await was introduced in 2017, React still lacking bullet proof support for it (encountered by first use of `use` hook, unless you haven't used it already). Seeing this I don't dare dreaming of support of async iterators.

Observables support in _React_ is even worse, first read blog by Dan Abramov on useInterval, then take a look at `Clock` component in the [xania project](#starting-new-project)

##### Work in progress

- release 1.0
- universal code client and server
- integrations with astro, remix, next.js if possible?

##### Definitely keep JSX and component functions

```jsx
function MyComponent() {
   return <span>Hello, World<span>;
}

render(<MyComponent />, document.body);
```

##### Keep useState, but add full HTML syntax support, use click not onClick, class not className

```jsx
function MyComponent() {
  const count = useState(0);
  return (
    <button click={(_) => count.update((x) => x + 1)}>Count: {count}</button>
  );
}
```

##### `useState` with objects

```jsx
function MyComponent() {
   var me = useState({ firstName: "Ibrahim", lastName: "ben Salah"});
   return (
      <div>
         fullName: {me.get("firstName")} {me.get("lastName"})
      </div>
   )
}
```

##### True first class support for async/await and promises, not the fake `use` hook

```jsx
async function MyComponent() {
  const ditto = await fetchPokemon();
  return <div>{ditto.name}</div>;
}
```

##### Support for async iterator (experimental / work in progress)

Not sure if one would expect this to end up with one final div and auto dispose all the previous, or all div's should be retained

```jsx
async function* MyComponent() {
  for (const delay of this.delays) {
    await this.wait(delay);
    yield <div>`Delayed response for ${delay} milliseconds`</div>;
  }
}
```

##### Support for observables (e.g. rxjs)

```jsx
function MyCounter() {
  const time = timer(0, 1000).pipe(map(() => new Date()));
  return <div>Current time: {time}</div>;
}
```

#### References

Examples project:
https://github.com/xania/examples

benchmark code:
https://github.com/xania/krausest-js-benchmark
