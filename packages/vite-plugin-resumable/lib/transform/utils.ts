import { Closure, Scope } from './scope';

export function selectRootClosures(
  root: Scope,
  hasClosure: (cl: Closure) => boolean
) {
  const stack: Scope[] = [root];
  const retval: Closure[] = [];

  const exclude = new Set<Scope>();

  while (stack.length) {
    const curr = stack.pop()!;

    for (const cl of curr.closures) {
      if (hasClosure(cl)) {
        retval.push(cl);
        exclude.add(cl.scope);
      }
    }

    for (const child of curr.children) {
      if (exclude.has(child)) {
        continue;
      }
      stack.push(child);
    }
  }

  return retval;
}

export function selectClosures(
  rootScope: Scope,
  entries: null | string[]
): Closure[] {
  const stack: Scope[] = [rootScope];

  const retval: Closure[] = [];
  while (stack.length) {
    const scope = stack.pop()!;
    if (entries instanceof Array) {
      for (const cl of scope.closures) {
        if (entries.includes(cl.exportName)) retval.push(cl);
      }
    } else {
      retval.push(...scope.closures);
    }

    for (const child of scope.children) {
      stack.push(child);
    }
  }

  return retval;
}

export function formattedArgs(
  closure: Closure,
  hasClosure: (cl: Closure) => boolean
) {
  const bindings = getBindings(closure, hasClosure);
  const [_, __, deps] = formatBindings(bindings);
  let retval = `"${closure.exportName}"`;
  if (deps.length) {
    retval += `, () => [${deps.join(', ')}]`;
  }

  return retval;
}

export function getBindings(
  closure: Closure,
  hasClosure: (cl: Closure) => boolean,
  stack = new Set()
) {
  const bindings = new Map<string, string | Closure>();

  if (stack.has(closure)) {
    return bindings;
  }
  stack.add(closure);

  for (const cl of closure.scope.closures) {
    if (hasClosure(cl)) {
      // bindings.set(cl.exportName, cl);
    }
  }

  for (const ref of closure.scope.references) {
    if (ref instanceof Closure) {
      if (hasClosure(ref)) {
        // bindings.set(ref.exportName, ref);
      }
    } else if (ref.type === 'Identifier') {
      if (
        !closure.scope.declarations.has(ref.name) &&
        resolve(closure.scope.parent, ref.name)
      ) {
        bindings.set(ref.name, ref.name);
      }
    } else if (!closure.scope.thisable) {
      bindings.set('this_' + closure.scope.owner.start, 'this');
    }
  }

  return bindings;

  function resolve(leaf: Scope | undefined, ref: string) {
    let scope: Scope | undefined = leaf;
    while (scope) {
      // if (scope.exports.has(ref)) return true;
      if (scope.declarations.has(ref)) return true;
      scope = scope.parent;
    }

    return false;
  }
}

export function formatBindings(
  bindings: Map<string, string | Closure>,
  stack = new Set()
) {
  if (stack.has(bindings)) {
    debugger;
    return [];
  }

  stack.add(bindings);

  const args: string[] = [];
  const params: string[] = [];
  const deps: string[] = [];

  for (const [k, arg] of bindings) {
    params.push(k);
    if (typeof arg === 'string') {
      deps.push(arg);
      args.push(arg);
    } else {
      deps.push(`__$R("${arg.exportName}")`);
      args.push(arg.exportName);
    }
  }

  return [params, args.join(', '), deps] as const;
}
