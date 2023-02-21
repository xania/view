import {
  ArrowFunctionExpression,
  BlockStatement,
  ClassDeclaration,
  ClassExpression,
  Declaration,
  ExportAllDeclaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  ExportSpecifier,
  Expression,
  ForStatement,
  FunctionDeclaration,
  FunctionExpression,
  Identifier,
  ImportDeclaration,
  MethodDefinition,
  Pattern,
  PrivateIdentifier,
  Program,
  Property,
  PropertyDefinition,
  ReturnStatement,
  SpreadElement,
  Super,
  ThisExpression,
  VariableDeclarator,
  WhileStatement,
} from 'estree';

export type ASTNode =
  | Super
  | ExportSpecifier
  | Declaration
  | BlockStatement
  | Expression
  | SpreadElement
  | Property
  | Pattern
  | ExportNamedDeclaration
  | ExportDefaultDeclaration
  | ClassDeclaration
  | ImportDeclaration
  | VariableDeclarator
  | ForStatement
  | Program
  | MethodDefinition
  | PropertyDefinition
  | WhileStatement
  | ThisExpression
  | PrivateIdentifier
  | ExportAllDeclaration
  | ReturnStatement;
