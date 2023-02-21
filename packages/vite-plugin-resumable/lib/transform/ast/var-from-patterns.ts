import { Pattern } from 'estree';
import { ASTNode } from '../ast-node';

export function variableFromPatterns(patterns: Pattern[]) {
  const vars: [string, ASTNode][] = [];
  const stack: Pattern[] = [...patterns];
  while (stack.length) {
    const pat = stack.pop()!;

    if (pat.type === 'Identifier') {
      vars.push([pat.name!, pat]);
    } else if (pat.type === 'ObjectPattern') {
      for (const p of pat.properties) {
        if (p.type === 'Property') {
          if (p.key.type === 'Identifier') {
            vars.push([p.key.name, p]);
          } else {
            debugger;
          }
        } else if (p.type === 'RestElement') {
          stack.push(p.argument);
        }
      }
    } else if (pat.type === 'ArrayPattern') {
      for (const elt of pat.elements) {
        if (elt) {
          stack.push(elt);
        }
      }
    } else if (pat.type === 'AssignmentPattern') {
      stack.push(pat.left);
    } else if (pat.type === 'RestElement') {
      stack.push(pat.argument);
    } else {
      debugger;
    }
  }
  return vars;
}
