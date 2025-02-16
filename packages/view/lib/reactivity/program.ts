export class Program {
  public instructions: Instruction[] = [];
}

type Instruction = StateInstruction;

interface StateInstruction {
  type: InstructionEnum.State;
}

enum InstructionEnum {
  State,
}

function run(program: Program) {}
