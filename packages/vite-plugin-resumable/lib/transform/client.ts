import { BaseNode, Program } from 'estree';
import MagicString from 'magic-string';
import { parse } from './parse';
import { Closure, Scope } from './scope';
import { formatBindings, getBindings, selectRootClosures } from './utils';

import { walk } from 'estree-walker';
import { ASTNode } from './ast-node';

declare module 'estree' {
  export interface BaseNode {
    start: number;
    end: number;
  }
}

export type TransfromOptions = {
  // selectClosures?(root: Scope, program?: Program): readonly Closure[];
  entries: string[] | null;
};

export function transformClient(
  code: string,
  opts: TransfromOptions
): { code: string; map: any } | undefined {
  const [rootScope, program, imports] = parse(code);
  const magicString = new MagicString(code);

  function hasClosure(cl: Closure) {
    if (opts.entries instanceof Array) {
      return opts.entries?.includes(cl.exportName);
    }
    return true;
  }

  const rootClosures: Closure[] = selectRootClosures(rootScope, hasClosure);

  const stack: Scope[] = [];
  for (const closure of rootClosures) {
    exportClosure(magicString, closure, hasClosure);
    // updateClosureReferences(magicString, closure, hasClosure);
    stack.push(closure.scope);
  }

  while (stack.length) {
    const scope = stack.pop()!;

    const closures = selectRootClosures(scope, hasClosure);

    for (const closure of closures) {
      exportClosure(magicString, closure, hasClosure);
      updateClosureReferences(magicString, closure, hasClosure);
      stack.push(closure.scope);
    }
  }

  stripProgram(
    magicString,
    program,
    rootClosures.map((cl) => cl.scope.owner)
  );

  return {
    code: magicString.toString(),
    map: magicString.generateMap({ hires: true }),
  };
}

function exportClosure(
  magicString: MagicString,
  closure: Closure,
  hasClosure: (cl: Closure) => boolean
) {
  const { owner, rootStart, parent } = closure.scope;

  const bindings = getBindings(closure, hasClosure);
  const [params, args, deps] = formatBindings(bindings);

  magicString.appendRight(
    owner.start,
    `export function ${closure.exportName}(${params.join(', ')}) {\n`
  );
  magicString.appendRight(owner.start, `  return `);
  if (owner.start !== rootStart) {
    magicString.move(owner.start, owner.end, rootStart);

    if (owner.type === 'FunctionExpression') {
      switch (closure.parent.type) {
        case 'Property':
          if (closure.parent.method) {
            magicString.appendRight(
              closure.scope.owner.start,
              `${owner.async ? 'async ' : ''}function `
            );
          }
          break;
      }
    }
  }
  magicString.appendLeft(owner.end, '\n}\n');
}

function updateClosureReferences(
  magicString: MagicString,
  closure: Closure,
  hasClosure: (cl: Closure) => boolean
) {
  const subBindings = getBindings(closure, hasClosure);
  const [subParams, subArgs, subDeps] = formatBindings(subBindings);

  const subOwner = closure.scope.owner;
  if (
    subOwner.type === 'FunctionDeclaration' ||
    subOwner.type === 'ClassDeclaration'
  ) {
    magicString.appendLeft(
      closure.scope.owner.start,
      `function ${subOwner.id!.name}(...args) { return ${
        closure.exportName
      }(${subArgs})(...args) }`
    );
  } else {
    const subParent = closure.parent;
    if (subParent) {
      switch (subParent.type) {
        case 'MethodDefinition':
          if (subOwner.type === 'FunctionExpression') {
            magicString.appendRight(
              subOwner.start,
              ` /* ${
                subParent.key.type === 'Identifier' ? subParent.key.name : ''
              } */ ${subOwner.async ? 'async' : ''} function `
            );
          }
          magicString.appendLeft(
            closure.scope.owner.start,
            ` = ${closure.exportName}(${subArgs});`
          );
          if (subParent.start < subParent.key.start) {
            magicString.overwrite(
              subParent.start,
              subParent.key.start,
              subParent.static ? 'static ' : ''
            );
          }
          break;
        case 'PropertyDefinition':
          magicString.appendLeft(
            closure.scope.owner.start,
            `${closure.exportName}(${subArgs})`
          );
          break;
        case 'AssignmentExpression':
        case 'CallExpression':
        case 'ReturnStatement':
          magicString.appendLeft(
            closure.scope.owner.start,
            `${closure.exportName}(${subArgs})`
          );
          break;
        case 'Property':
          magicString.appendLeft(
            closure.scope.owner.start,
            `: ${closure.exportName}(${subArgs})`
          );
          if (subParent.start < subParent.key.start) {
            magicString.remove(subParent.start, subParent.key.start);
          }
          break;
        default:
          magicString.appendLeft(
            closure.scope.owner.start,
            `|${subParent.type}|`
          );
          break;
      }
    }
  }

  // for (const ref of closure.scope.references) {
  //   if (ref instanceof Closure) {
  //     const bindings = getBindings(ref, hasClosure);
  //     const [params, args, deps] = formatBindings(bindings);

  //     const closureInitExpr = `(${ref.exportName}(${args}))`;

  //     magicString.appendLeft(ref.scope.owner.start, closureInitExpr);
  //   }
  // }

  for (const ref of closure.scope.references) {
    if (ref instanceof Closure) {
    } else if (ref.type === 'ThisExpression') {
      if (!closure.scope.thisable) {
        magicString.overwrite(
          ref.start,
          ref.end,
          'this_' + closure.scope.owner.start
        );
      }
    }
  }
  // if (parentScope) {
  //   for (const ref of parentScope.references) {
  //     if (ref instanceof Closure) {
  //     } else if (ref.type === 'Identifier') {
  //       // if (ref.name === closureName)
  //       // magicString.overwrite(ref.start, ref.end, refSubstitute);
  //     } else {
  //       // magicString.overwrite(
  //       //   ref.start,
  //       //   ref.end,
  //       //   '__this_' + closure.parent.start
  //       // );
  //     }
  //   }
  // }

  // const closureInitExpr = formatInit(closure.exportName, args);

  // if (
  //   closure.parent.type === 'BlockStatement' ||
  //   closure.parent.type === 'Program'
  // ) {
  //   if (
  //     owner.type === 'FunctionDeclaration' ||
  //     owner.type === 'FunctionExpression' ||
  //     owner.type === 'ClassDeclaration'
  //   ) {
  //     if (owner.id) {
  //       magicString.appendLeft(
  //         owner.start,
  //         `const ${owner.id.name} = ${closureInitExpr};\n`
  //       );
  //     }
  //   } else {
  //     console.log(owner.type);
  //   }
  // } else if (closure.parent.type === 'ExportNamedDeclaration') {
  //   if (
  //     owner.type === 'FunctionDeclaration' ||
  //     owner.type === 'ClassDeclaration'
  //   ) {
  //     magicString.appendLeft(owner.start, 'const ' + owner.id!.name + ' = ');
  //   }

  //   magicString.appendLeft(owner.start, closureInitExpr);
  // } else if (closure.parent.type === 'ExportDefaultDeclaration') {
  //   if (owner.type === 'FunctionDeclaration') {
  //     if (owner.id) {
  //       magicString.appendRight(
  //         closure.parent.start,
  //         `const ${owner.id.name} = ${closureInitExpr};\n`
  //       );
  //       magicString.appendLeft(owner.start, owner.id.name);
  //     } else {
  //       magicString.appendLeft(owner.start, closureInitExpr);
  //     }
  //   } else {
  //     magicString.appendLeft(owner.start, closure.exportName);
  //   }
  // } else {
  //   if (closure.parent.type === 'MethodDefinition') {
  //     magicString.appendLeft(owner.start, ' = ');

  //     const parent = closure.parent;

  //     if (parent.value.async) {
  //       magicString.appendRight(owner.start, 'async function');
  //     } else {
  //       magicString.appendRight(owner.start, 'function ');
  //     }

  //     if (parent.static) {
  //       magicString.overwrite(parent.start, parent.key.start, 'static ');
  //     } else {
  //       magicString.remove(parent.start, parent.key.start);
  //     }
  //   } else if (closure.parent.type === 'Property') {
  //     if (closure.parent.method) {
  //       magicString.appendLeft(owner.start, ' : ');

  //       const prefix = magicString.slice(
  //         closure.parent.start,
  //         closure.parent.key.start
  //       );

  //       magicString.remove(closure.parent.start, closure.parent.key.start);

  //       magicString.appendRight(owner.start, prefix + 'function ');
  //     } else {
  //     }
  //   }

  //   // ============== Default ================
  //   if (
  //     owner.type === 'FunctionDeclaration' ||
  //     owner.type === 'FunctionExpression' ||
  //     owner.type === 'ArrowFunctionExpression' ||
  //     owner.type === 'ClassDeclaration' ||
  //     owner.type === 'ClassExpression'
  //   ) {
  //     magicString.appendLeft(owner.start, closureInitExpr);
  //   } else {
  //     console.log(owner.type);
  //   }
  // }
}

function stripProgram(
  magicString: MagicString,
  program: Program,
  excludes: BaseNode[]
) {
  let start = program.start;

  walk(program, {
    enter(n) {
      const node = n as ASTNode;
      if (node.type === 'ImportDeclaration') {
        this.skip();
        start = n.end;
      } else if (excludes.includes(n)) {
        magicString.appendLeft(start, '\n');
        magicString.remove(start, n.start);
        start = n.end;

        this.skip();
      }
    },
  });

  magicString.appendLeft(start, '\n');
  magicString.remove(start, program.end);
}
