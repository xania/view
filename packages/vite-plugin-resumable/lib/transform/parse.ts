import * as acorn from 'acorn';
import { walk } from 'estree-walker';
import { variableFromPatterns } from './ast/var-from-patterns';
import {
  ExportNamedDeclaration,
  Identifier,
  ImportDeclaration,
  Program,
} from 'estree';
import { Closure, Scope } from './scope';
import { ASTNode } from './ast-node';
import MagicString from 'magic-string';

const CSS_LANGS_RE =
  /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;

export function parse(code: string) {
  const ast = acorn.parse(code, {
    sourceType: 'module',
    ecmaVersion: 'latest',
  }) as Program;

  const imports: Import[] = [];
  const programScope = new Scope(0, ast, false);
  const scopes: Scope[] = [programScope];

  let entryDeclaration: ExportNamedDeclaration['declaration'] | null = null;

  let rootStart = 0;

  const skipEnter = new Map<ASTNode, 'deep' | 'shallow'>();

  walk(ast, {
    enter(n, p) {
      const node = n as ASTNode;
      const parent = (p || ast) as ASTNode;
      const scope = scopes[scopes.length - 1]!;

      if (p === ast) {
        rootStart = node.start;
      }

      if (node.type === 'ExportNamedDeclaration') {
        for (const s of node.specifiers) {
          skipEnter.set(s, 'deep');
        }
      }

      // if (
      //   parent.type === 'ExportNamedDeclaration' ||
      //   parent.type === 'ExportDefaultDeclaration'
      // ) {
      //   scope.dependents.push([node, parent]);
      // }

      if (skipEnter.has(node)) {
        const mode = skipEnter.get(node);
        skipEnter.delete(node);
        if (mode === 'deep') {
          this.skip();
        }
        return;
      } else if (node.type === 'ExportNamedDeclaration') {
        entryDeclaration = node.declaration;
      } else if (node.type === 'ReturnStatement') {
        const returnScope = scope.create(rootStart, node, false);
        scopes.push(returnScope);
      } else if (node.type === 'ImportDeclaration') {
        imports.push(new Import(node));
      } else if (
        node.type === 'ClassDeclaration' ||
        node.type === 'ClassExpression'
      ) {
        const classScope = scope.create(rootStart, node, true);
        scopes.push(classScope);

        if (node.id) {
          scope.declarations.set(node.id.name, node);
          skipEnter.set(node.id, 'deep');
          const alias = __alias(code, node, scope.rootStart);
          scope.closures.push(
            new Closure(alias, parent, classScope, entryDeclaration)
          );
        }
      } else if (
        node.type === 'MethodDefinition' ||
        node.type === 'PropertyDefinition' ||
        node.type === 'Property'
      ) {
        skipEnter.set(node.key, 'deep');

        if (node.type === 'MethodDefinition' && node.kind === 'constructor')
          skipEnter.set(node.value, 'shallow');

        // const memberScope = scope.create(rootStart, node, true);
        // scopes.push(memberScope);
      } else if (node.type === 'ArrowFunctionExpression') {
        const funcScope = scope.create(rootStart, node, false);
        for (const [v, p] of variableFromPatterns(node.params)) {
          funcScope.declarations.set(v, p);
        }
        scopes.push(funcScope);

        for (const p of node.params) skipEnter.set(p, 'deep');
        const alias = __alias(code, node, rootStart);
        scope.closures.push(
          new Closure(alias, parent, funcScope, entryDeclaration)
        );
      } else if (
        node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression'
      ) {
        const funcScope = scope.create(rootStart, node, true);
        for (const [v, p] of variableFromPatterns(node.params)) {
          funcScope.declarations.set(v, p);
        }
        scopes.push(funcScope);

        for (const p of node.params) skipEnter.set(p, 'deep');

        if (node.id) {
          skipEnter.set(node.id!, 'deep');
          scope.declarations.set(node.id.name, node);
          funcScope.declarations.set(node.id.name, node);
        }

        if (parent.type !== 'MethodDefinition' || parent.kind !== 'get') {
          const alias = __alias(code, node, rootStart);
          scope.closures.push(
            new Closure(alias, parent, funcScope, entryDeclaration)
          );
        }
      } else if (node.type === 'MemberExpression') {
        skipEnter.set(node.property!, 'deep');
      } else if (
        node.type === 'ForStatement' ||
        node.type === 'WhileStatement'
      ) {
        scopes.push(scope.create(rootStart, node, false));
      } else if (node.type === 'VariableDeclarator') {
        skipEnter.set(node.id, 'deep');
        const vars: string[] = [];
        for (const [v, p] of variableFromPatterns([node.id])) {
          vars.push(v);
          scope.declarations.set(v, p);
        }
      } else if (node.type === 'VariableDeclaration') {
      } else if (node.type === 'Identifier') {
        scope.references.push(node);
      } else if (node.type === 'ThisExpression') {
        scope.references.push(node);
      }
    },
    leave(n) {
      const node = n as ASTNode;
      const scope = scopes[scopes.length - 1]!;

      if (node.type === 'ExportNamedDeclaration') {
        entryDeclaration = null;
      }

      if (scope.owner === node) {
        const blockScope = scopes.pop()!;
        blockScope.mergeChildren();
      }
    },
  });

  return [programScope, ast, imports] as const;
}

function __alias(
  str: string,
  { id, start, end }: { id?: Identifier | null; start: number; end: number },
  exportIndex: number
) {
  const baseName = id ? id.name.slice(0, 5) : '';
  const maxLen = 10 - baseName.length;
  const bits = new Int8Array({ length: maxLen }).fill(
    (Math.abs(start - exportIndex - 97) % (122 - 97)) + 97
  );
  for (let i = 0, len = end - start + 1; i < len; i++) {
    const u = i % maxLen;
    const c = str.charCodeAt(i + start) ^ bits[u];

    bits[u] = (Math.abs(c - 97) % (122 - 97)) + 97;
  }

  const retval = baseName + '$' + String.fromCharCode(...bits);

  return retval;
}

export class Import {
  public readonly vars: string[] = [];

  constructor(public decl: ImportDeclaration) {
    for (const spec of decl.specifiers) {
      if (spec.type === 'ImportSpecifier') {
        this.vars.push(spec.local.name);
      }
    }
    // variableFromPatterns(decl.specifiers)
  }

  get source() {
    return this.decl.source.value;
  }

  update(magicString: MagicString, target: string) {
    const { decl } = this;

    const source = decl.source;
    if (!CSS_LANGS_RE.test(source.value as string)) {
      if (source) {
        const match = source.raw?.match(/\.[jt]sx?/);
        if (match) {
          magicString.appendRight(source.start + 1, `/@${target}`);
        } else {
          console.error(source);
        }
      }
    }
  }
}
