import { Program } from 'estree';
import MagicString from 'magic-string';
import { parse } from './parse';
import { Closure, Scope } from './scope';
import { formattedArgs, selectClosures } from './utils';

declare module 'estree' {
  export interface BaseNode {
    start: number;
    end: number;
  }
}

export const CLOSURE_HELPER = `
function __$C(fn, name, args) { return Object.assign(fn, {__src: import.meta.url, __name: name, __args: args}) }
function __$R(name) { return {__ref: name} }
`;

export type TransfromOptions = {
  includeHelper?: boolean;
};

export function transformServer(
  code: string,
  opts: TransfromOptions
): { code: string; map: any } | undefined {
  const [rootScope, program, imports] = parse(code);
  const magicString = new MagicString(code);

  const closures = selectClosures(rootScope, null);

  function hasClosure(cl: Closure) {
    return closures.includes(cl);
  }

  for (const closure of closures) {
    exportClosure(magicString, closure, hasClosure);
  }

  // for (const im of imports) {
  //   im.update(magicString, 'server');
  // }

  if (opts.includeHelper === undefined || opts.includeHelper === true) {
    magicString.append(CLOSURE_HELPER);
  }

  return {
    code: magicString.toString(),
    map: magicString.generateMap(),
  };
}

function exportClosure(
  magicString: MagicString,
  closure: Closure,
  hasClosure: (cl: Closure) => boolean
) {
  const { scope, parent } = closure;

  if (
    scope.owner.type === 'FunctionDeclaration' ||
    scope.owner.type === 'ClassDeclaration'
  ) {
    const funcName = scope.owner.id!.name;
    if (parent) {
      switch (parent.type) {
        case 'BlockStatement':
        case 'Program':
          magicString.appendLeft(
            scope.owner.end,
            // `__$C(${funcName}, "${exportName}", [${deps}]);\n`
            `\n__$C(${funcName}, ${formattedArgs(closure, hasClosure)});`
          );
          break;
        case 'ExportNamedDeclaration':
          magicString.appendLeft(
            parent.end,
            `\n__$C(${funcName}, ${formattedArgs(closure, hasClosure)});`
          );
          break;

        case 'MethodDefinition':
          // magicString.appendRight(
          //   scope.owner.start,
          //   `${annotate(funcName, closure, hasClosure)};\n`
          // );
          break;
        default:
          console.log(funcName, parent.type);
          break;
      }
    } else {
      // magicString.appendRight(owner.end, `\n__$C(`);
    }
  } else if (scope.owner.type === 'FunctionExpression') {
    if (parent) {
      switch (parent.type) {
        case 'Property':
          if (parent.method) {
            if (scope.owner.async) {
              magicString.appendLeft(parent.key.end, ': __$C(async function');
            } else {
              magicString.appendLeft(parent.key.end, ': __$C(function ');
            }
            magicString.appendLeft(
              scope.owner.end,
              `, ${formattedArgs(closure, hasClosure)})`
            );

            if (parent.start < parent.key.start)
              magicString.overwrite(parent.start, parent.key.start, '');
          } else {
            magicString.appendRight(scope.owner.start, '__$C(');
            magicString.appendLeft(
              scope.owner.end,
              `, ${formattedArgs(closure, hasClosure)})`
            );
          }

          break;
        case 'MethodDefinition':
          if (scope.owner.async) {
            magicString.appendLeft(parent.key.end, ' = __$C(async function');
          } else {
            magicString.appendLeft(parent.key.end, ' = __$C(function ');
          }
          magicString.appendLeft(
            scope.owner.end,
            `, ${formattedArgs(closure, hasClosure)})`
          );

          if (parent.start < parent.key.start)
            magicString.overwrite(
              parent.start,
              parent.key.start,
              parent.static ? 'static ' : ''
            );

          break;
        default:
          magicString.appendRight(scope.owner.start, '__$C(');
          magicString.appendLeft(
            scope.owner.end,
            `, ${formattedArgs(closure, hasClosure)})`
          );
          break;
      }
    }
  } else if (scope.owner.type === 'ArrowFunctionExpression') {
    magicString.appendRight(scope.owner.start, '__$C(');
    magicString.appendLeft(
      scope.owner.end,
      `, ${formattedArgs(closure, hasClosure)})`
    );
  }
}
