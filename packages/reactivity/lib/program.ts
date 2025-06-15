import { ITextNode } from './automaton';

export type Program = Instruction[];

export type Instruction =
  | StateInstruction
  | FuncInstruction
  | SetTextInstruction
  | ReadInstruction
  | EffectInstruction
  | ShowInstruction;

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
  func: (x: any) => void | Promise<void>;
}

export interface ShowInstruction {
  type: InstructionEnum.Show;
  level: number;
  region: {
    show(visible: boolean): void;
  };
}

export enum InstructionEnum {
  Write = 4356234 /* magic number */,
  Read,
  Map,
  Effect,
  SetText,
  Show,
}
