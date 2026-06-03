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
  | PopOutputInstruction
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
  initial: any;
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
  Write = 'Write',
  Read = 'Read',
  Map = 'Map',
  Effect = 'Effect',
  SetText = 'SetText',
  Show = 'Show',
  Clone = 'Clone',
  Jump = 'Jump',
  UpdateArray = 'UpdateArray',
  UpdateObject = 'UpdateObject',
  PopOutput = 'PopOutput',
  SelectFragment = 'SelectFragment',
  SelectFragments = 'SelectFragments',
  SelectProperty = 'SelectProperty',
  SelectIndex = 'SelectIndex',
}

export type TraversalInstruction =
  | SelectFragmentsInstruction
  | SelectPropertyInstruction
  | SelectIndexInstruction;

interface PopOutputInstruction {
  type: InstructionEnum.PopOutput;
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
