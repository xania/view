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
          currentOutput = new Fragment(currentOutput, instruction.index);
        else if (currentOutput instanceof Fragment) {
          currentOutput.offset = instruction.index;
        }
        break;
      case InstructionEnum.UpdateArray:
        if (currentOutput instanceof Array) {
          currentOutput[instruction.index] = currentValue;
        } else if (currentOutput instanceof Fragment) {
          const idx = currentOutput.offset + instruction.index;
          currentOutput.output[idx] = currentValue;
        }
        break;
      case InstructionEnum.UpdateObject:
        (currentOutput as any)[instruction.property] = currentValue;
        break;
      case InstructionEnum.SelectIndex:
        if (currentOutput instanceof Fragment) {
          const idx = currentOutput.offset + instruction.index;
          currentOutput = currentOutput.output[idx];
        }
        break;
      default:
        const unsupportedType = InstructionEnum[type];
        console.warn(`instruction type not supported ${unsupportedType}`);
        break;
    }
  }
}

export class Fragment {
  constructor(
    public output: any[],
    public offset: number
  ) {}
}
