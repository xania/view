import { AutomatonTemplate, IRegion, ITextNode, Updatable } from './automaton';
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
  | UpdateArrayInstruction
  | UpdateObjectInstruction
  | UpdateRegionsInstruction
  | MoveNextInstruction
  | PopTargetInstruction
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

export interface ForEachInstruction {
  type: InstructionEnum.ForEach;
  exprKey: symbol;
  itemState?: symbol;
  jump: number;
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
  output?: Updatable;
  property: number | string | symbol;
}

export interface UpdateRegionsInstruction {
  type: InstructionEnum.UpdateRegions;
  regions: number[];
  index: number;
}

export interface MoveNextInstruction {
  type: InstructionEnum.MoveNext;
  jump: number;
  regions: number[];
  template: AutomatonTemplate;
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
  UpdateArray,
  UpdateObject,
  UpdateRegions,
  MoveNext,
  PopTarget,
  SelectFragment,
  SelectFragments,
  SelectProperty,
  SelectIndex,
}

export type TraversalInstruction =
  | SelectFragmentInstruction
  | SelectFragmentsInstruction
  | SelectPropertyInstruction
  | SelectIndexInstruction
  | ForEachInstruction;
interface SelectFragmentInstruction {
  type: InstructionEnum.SelectFragment;
  index: number;
}

interface SelectFragmentsInstruction {
  type: InstructionEnum.SelectFragments;
  indices: number[];
}

interface SelectPropertyInstruction {
  type: InstructionEnum.SelectProperty;
  prop: string | number | symbol;
}

interface SelectIndexInstruction {
  type: InstructionEnum.SelectIndex;
  index: number;
}
