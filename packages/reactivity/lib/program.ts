import { ITextNode, Updatable } from './automaton';
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
  | JumpInstruction
  | UpdateInstruction
  | UpdateManyInstruction
  | MoveNextInstruction
  | PopTargetInstruction;

export interface SetTextInstruction {
  type: InstructionEnum.SetText;
  node: ITextNode;
}

export interface StateInstruction {
  type: InstructionEnum.Write;
  key: symbol;
}

export interface ReadInstruction {
  type: InstructionEnum.Read;
  key: symbol;
}

export interface FuncInstruction {
  type: InstructionEnum.Map;
  func: Function;
}

export interface EffectInstruction {
  type: InstructionEnum.Effect;
  func: (x: any) => void | Promise<void>;
}

export interface ShowInstruction {
  type: InstructionEnum.Show;
  node: {
    show(visible: boolean): void;
  };
}

export interface ForEachInstruction {
  type: InstructionEnum.ForEach;
  exprKey: symbol;
  itemState?: symbol;
}

export interface CloneInstruction {
  type: InstructionEnum.Clone;
  template: {
    clone(visible?: boolean): void;
  };
}

export interface JumpInstruction {
  type: InstructionEnum.Jump;
  steps: number;
}

export interface UpdateInstruction {
  type: InstructionEnum.Update;
  target?: Updatable;
  property: string | number;
}

export interface UpdateManyInstruction {
  type: InstructionEnum.UpdateMany;
  targets: Updatable[];
  property: string | number;
}

export interface MoveNextInstruction {
  type: InstructionEnum.MoveNext;
  jump: number;
}

export interface PopTargetInstruction {
  type: InstructionEnum.PopTarget;
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
  Jump,
  Update,
  UpdateMany,
  MoveNext,
  PopTarget,
}

export type TraversalInstruction =
  | SelectIndexInstruction
  | SelectPropertyInstruction;
interface SelectIndexInstruction {
  type: TraversalEnum.SelectIndex;
  index: number;
}

interface SelectPropertyInstruction {
  type: TraversalEnum.SelectProperty;
  prop: string;
}

export enum TraversalEnum {
  SelectIndex = 9038592,
  SelectProperty,
}
