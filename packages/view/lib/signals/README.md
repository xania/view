- each state is created within a scope where we store current state value
- async views are rendered sequentially by default

### use cases

- bind a state<string> to a text node
- bind a state<bool> to a condition around a partial view
- bind a state<T[]> to a template

- derive a state from another

### bound state

In some cases it makes to combine two distinct state x and y and consequently mapping it to some calculate values.
The first consideration is if both of the state x and y have the same origin, like for example in a diamand shape graph.
How much do we need this feature? What are the alternatives?

- for each two state x and y one can create a new z state in user land and manage updates manually
  -> this is it, that's why this is not MVP and won't be included in the first release version
