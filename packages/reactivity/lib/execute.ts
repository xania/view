import { InstructionEnum, type Program } from './program';

export function execute(currentValue: any, output: unknown, program: Program) {
  let currentOutput = output;

  for (
    let instructionIdx = 0;
    instructionIdx < program.length;
    instructionIdx++
  ) {
    const instruction = program[instructionIdx];

    const { type } = instruction;
    switch (type) {
      case InstructionEnum.SelectFragment:
        if (currentOutput instanceof Array)
          currentOutput = new Region(currentOutput, instruction.index);
        else if (currentOutput instanceof Region) {
          currentOutput.offset = instruction.index;
        }
        break;
      case InstructionEnum.UpdateArray:
        if (currentOutput instanceof Array) {
          currentOutput[instruction.index] = currentValue;
        } else if (currentOutput instanceof Region) {
          const idx = currentOutput.offset + instruction.index;
          currentOutput.output[idx] = currentValue;
        }
        break;
    }
  }
}

export class Region {
  constructor(
    public output: any[],
    public offset: number
  ) {}
}
