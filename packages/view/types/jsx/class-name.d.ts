declare namespace JSX {
  type ClassValue = string | string[];

  export type ClassInput = ClassInput[] | ClassValue | Promise<ClassValue>;
}
