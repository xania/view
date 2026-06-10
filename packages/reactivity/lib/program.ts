import { AutomatonTemplate, ITextNode } from './automaton';

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
  | IfVisibleInstruction
  | SelectTemplateInstruction
  | PushOutputInstruction
  | PushPropertyInstruction
  | PushIndexInstruction;
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
  type: InstructionEnum.MapState;
  func: Function;
  key: symbol;
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
    clone(): void;
  };
}

export interface JumpInstruction {
  type: InstructionEnum.Jump;
  steps: number;
}

export interface IfVisibleInstruction {
  type: InstructionEnum.IfVisible;
  steps: number;
  node: {
    visible: boolean | void;
  };
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
  MapState = 'MapState',
  Effect = 'Effect',
  SetText = 'SetText',
  Show = 'Show',
  Clone = 'Clone',
  Jump = 'Jump',
  IfVisible = 'IfVisible',
  UpdateArray = 'UpdateArray',
  UpdateObject = 'UpdateObject',
  PopOutput = 'PopOutput',
  SelectFragment = 'SelectFragment',
  PushOutput = 'SelectOutput',
  SelectTemplate = 'SelectTemplate',
  PushProperty = 'PushProperty',
  PushIndex = 'PushIndex',
}

interface PopOutputInstruction {
  type: InstructionEnum.PopOutput;
}

interface SelectTemplateInstruction {
  type: InstructionEnum.SelectTemplate;
  tpl: AutomatonTemplate;
  key: symbol;
  jump: number;
}

interface PushOutputInstruction {
  type: InstructionEnum.PushOutput;
  output: any;
}

interface PushPropertyInstruction {
  type: InstructionEnum.PushProperty;
  prop: string | number | symbol;
}

interface PushIndexInstruction {
  type: InstructionEnum.PushIndex;
  index: number;
}
