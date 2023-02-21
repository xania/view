import { Declaration, Identifier, ThisExpression } from 'estree';
import { ASTNode } from './ast-node';

export class Scope {
  public readonly declarations = new Map<string, ASTNode>();
  public readonly references: (Identifier | ThisExpression | Closure)[] = [];
  public readonly closures: Closure[] = [];
  public readonly children: Scope[] = [];
  public readonly expressions = new Map<ASTNode, Closure>();

  constructor(
    public rootStart: number,
    public owner: ASTNode,
    public thisable: boolean,
    public parent?: Scope
  ) {
    if (parent) {
      parent.children.push(this);
    }
  }

  create(rootStart: number, node: ASTNode, thisable: boolean) {
    return new Scope(rootStart, node, thisable, this);
  }

  mergeChildren() {
    for (const child of this.children) {
      // if (!exportedScopes.has(child)) {
      for (const ref of child.references) {
        if (ref instanceof Closure) {
          this.references.push(ref);
        } else if (ref.type === 'Identifier') {
          if (!child.declarations.has(ref.name)) {
            let scope: Scope | undefined = this;
            while (scope) {
              if (scope.declarations.has(ref.name)) {
                this.references.push(ref);
                break;
              }
              scope = scope.parent;
            }
          }
        } else if (ref.type === 'ThisExpression') {
          if (!child.thisable) {
            this.references.push(ref);
          }
        }
      }
      for (const closure of child.closures) {
        this.references.push(closure);
      }
    }
  }
}

export class ScopeBinding {
  constructor(
    public param: string,
    public dep: string,
    public depArgs: string[]
  ) {}

  get arg() {
    if (this.depArgs.length) {
      return `${this.dep}(${this.depArgs.join(', ')})`;
    } else {
      return this.dep;
    }
  }
}

// export class DeclarationScope {
//   public readonly rootStart: Scope['rootStart'];
//   public readonly declarations: Scope['declarations'];
//   public readonly closures: Scope['closures'];
//   public readonly references: Scope['references'];
//   public readonly expressions: Scope['expressions'];

//   constructor(
//     public owner: VariableDeclarator,
//     public vars: string[],
//     public scope: Scope
//   ) {
//     this.rootStart = scope.rootStart;
//     this.declarations = scope.declarations;
//     this.closures = scope.closures;
//     this.references = [];
//     this.expressions = new Map();
//   }

//   create(rootStart: number, node: ASTNode, thisable: boolean) {
//     return this.scope.create(rootStart, node, thisable);
//   }

//   mergeChildren() {
//     if (this.owner.init) {
//       const initExpr = this.expressions.get(this.owner.init);
//       if (initExpr)
//         for (const v of this.vars) {
//           this.scope.mappings.set(v, initExpr);
//         }
//     }
//   }
// }

export class Closure {
  public references: Scope['references'] = [];

  constructor(
    public exportName: string,
    public parent: ASTNode,
    public scope: Scope,
    public entry: Declaration | null | undefined
  ) {}
}
