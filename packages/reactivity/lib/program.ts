import { ITextNode } from './automaton';
import { Scope } from './state';

export type Program = Instruction[];

export type Instruction =
  | StateInstruction
  | FuncInstruction
  | SetTextInstruction
  | ReadInstruction
  | EffectInstruction
  | ShowInstruction
  | ForEachInstruction
  | CloneInstruction
  | JumpInstruction;

export interface SetTextInstruction {
  type: InstructionEnum.SetText;
  level: number;
  node: ITextNode;
}

export interface StateInstruction {
  type: InstructionEnum.Write;
  level: number;
  key: symbol;
}

export interface ReadInstruction {
  type: InstructionEnum.Read;
  level: number;
  key: symbol;
}

export interface FuncInstruction {
  type: InstructionEnum.Map;
  level: number;
  func: Function;
}

export interface EffectInstruction {
  type: InstructionEnum.Effect;
  level: number;
  func: (scope: Scope, x: any) => void | Promise<void>;
}

export interface ShowInstruction {
  type: InstructionEnum.Show;
  level: number;
  node: {
    show(visible: boolean): void;
  };
}

export interface ForEachInstruction {
  type: InstructionEnum.ForEach;
  level: number;
  exprKey: symbol;
  itemState?: symbol;
}

export interface CloneInstruction {
  type: InstructionEnum.Clone;
  level: number;
  jump: number;
  template: {
    clone(visible?: boolean): void;
  };
}

export interface JumpInstruction {
  type: InstructionEnum.MoveNext;
  level: number;
  steps: number;
}

export enum InstructionEnum {
  Write = 4356234 /* magic number */,
  Read,
  Map,
  Effect,
  SetText,
  Show,
  ForEach,
  Clone,
  MoveNext,
}
