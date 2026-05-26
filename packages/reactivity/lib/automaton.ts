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
  popTarget(): void;
  appendObject(): void;
  selectProperty(prop: string): void;
  appendArray(): void;
  appendValue(
    sourceScope: Scope,
    content?: string | number | undefined
  ): Program | undefined;
  appendText(content?: ITextNode['nodeValue']): ITextNode | TextNodeUpdater;
  appendNode(visible: boolean): INode;
  pushRegion(visible: boolean): IRegion;
  pushTemplate(scope: Scope): ITemplate;
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
  push(item: any): void;
  show(visible: boolean): void;
};
export type IRegion = {
  push(item: any): void;
  show(visible: boolean): void;
  update(idx: number, value: any): void;
};

export type ITemplate = {
  push(scope: Scope, item: any): void;
  clone(visible?: boolean): IRegion;
};
