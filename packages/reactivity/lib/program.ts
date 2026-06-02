import { ITextNode } from './automaton';

export type Program = Instruction[];

export type Instruction =
  | StateInstruction
  | FuncInstruction
  | SetTextInstruction
  | ReadInstruction
  | EffectInstruction
  | ShowInstruction
  | CloneInstruction
  | JumpInstruction
  | UpdateArrayInstruction
  | UpdateObjectInstruction
  | TraversalInstruction;

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

export interface UpdateArrayInstruction {
  type: InstructionEnum.UpdateArray;
  index: number;
}

export interface UpdateObjectInstruction {
  type: InstructionEnum.UpdateObject;
  property: number | string | symbol;
}

export enum InstructionEnum {
  Write = 4356234 /* magic number */,
  Read,
  Map,
  Effect,
  SetText,
  Show,
  Clone,
  Jump,
  UpdateArray,
  UpdateObject,
  SelectFragment,
  SelectFragments,
  SelectProperty,
  SelectIndex,
}

export type TraversalInstruction =
  | SelectFragmentsInstruction
  | SelectPropertyInstruction
  | SelectIndexInstruction;
interface SelectFragmentInstruction {
  type: InstructionEnum.SelectFragment;
  index: number;
}

interface SelectFragmentsInstruction {
  type: InstructionEnum.SelectFragments;
  indices: number[];
  key: symbol;
  jump: number;
}

interface SelectPropertyInstruction {
  type: InstructionEnum.SelectProperty;
  prop: string | number | symbol;
}

interface SelectIndexInstruction {
  type: InstructionEnum.SelectIndex;
  index: number;
}
