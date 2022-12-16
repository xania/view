# @xania/view

@xania/view is a JavaScript view library for building user interfaces

#### Goal

Goal of _Xania_ is to 'fix' React. Keep using the good parts (JSX is king, fractal-unidirectional data flow) but prevent issues (stale closures) from happening so that we don't have to solve them using hooks.

Also, goal is to proof simple design is the best design:

- supports all primitives of the platform
- easy to understand and intuitive (for you to judge)
- fastest, literally (see [benchmark](https://krausest.github.io/js-framework-benchmark/2022/table_chrome_104_windows.html))

##### 1. Prevent issues.

Most of the issues in React are caused by the re-rendering of the component on state change. All these hooks have cascading issues, it's funny that some hooks are introduced to mitigate issues from other hooks and also introduce new issues.

- ~~useEffect~~
- ~~useCallback~~
- ~~useMemo~~
- ~~useRef~~
- ~~use~~
- ~~cache~~
- ...

So how can we update the view without re-rendering? The solution is examined by _Xania_ is fine-grained reactivity.

##### 2. Use the platform

First class support for

- async/await
- promises
- observables (any object that implements `subscribe`)
- async iterators (design phase, see question)
- arrays (just like React)

Javascript is expressive and is getting better. While async/await was introduced in 2017, React still lacking bullet proof support for it (encountered by first use of `use` hook, unless you haven't used it already). Seeing this I don't dare dreaming of support of async iterators.
So we fixed that:

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
  const [count, updateCount] = useState(0);
  return <button click={(_) => updateCount(count + 1)}>Count: {count}</button>;
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
  const ditto = await fetch('https://pokeapi.co/api/v2/pokemon/ditto').then(
    (e) => e.json()
  );
  return <div>{ditto.name}</div>;
}
```

##### Support for async iterator (work in progress)

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
