export type ContainerOperation =
  | ContainerForEachOperation
  | ContainerUpdateOperation;

enum ContainerOperationType {
  ForEach,
  Update,
}

interface ContainerForEachOperation {
  type: ContainerOperationType.ForEach;
  index: number;
  next?: ContainerOperation;
}

interface ContainerUpdateOperation {
  type: ContainerOperationType.Update;
  property: string;
}

export function foreach(idx: number, step: number) {
  return {
    type: ContainerOperationType.ForEach,
    index: idx,
    step,
  };
}
