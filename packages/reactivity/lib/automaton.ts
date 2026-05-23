import { Program } from './program';
import { Scope, State } from './state';

export type Updatable =
  | {
      update?: (idx: number | string, value: any) => void;
      [key: string]: any;
    }
  | Record<string | number, any>;

export interface Automaton {
  currentTarget: Updatable;
  up(): void;
  appendArray(property?: string): void;
  appendObject(property?: string): void;
  appendElement(child: any, property?: string): Array<any> | Record<any, any>; // -> children
  appendValue(
    sourceScope: Scope,
    content?: string | number | undefined,
    property?: string
  ): Program | undefined;
  appendText(
    scope: Scope,
    content?: ITextNode['nodeValue'],
    property?: string
  ): ITextNode | TextNodeUpdater;
  appendNode(visible: boolean, property?: string): INode;
  pushRegion(visible: boolean, property?: string): IRegion;
  pushTemplate(scope: Scope, property?: string): ITemplate;
}

export type TextNodeUpdater = (nodeValue: any) => void;
export interface ITextNode {
  nodeValue: any;
}

export class SetProperty {
  constructor(
    public name: string,
    public value: any
  ) {}
}

export const popScope = Symbol();

export type INode = {
  push(item: any, property?: string): void;
  show(visible: boolean): void;
};
export type IRegion = {
  push(item: any, property?: string): void;
  show(visible: boolean): void;
  update(idx: number, value: any): void;
};

export type ITemplate = {
  push(scope: Scope, item: any, property?: string): void;
  clone(visible?: boolean): IRegion;
};
