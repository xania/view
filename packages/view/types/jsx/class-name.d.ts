declare namespace JSX {
  type ClassValue = null | undefined | string | string[] | Stateful<ClassValue>;

  export type ClassInput = ClassInput[] | ClassValue | Promise<ClassValue>;
}
