declare namespace JSX {
  type ClassValue = null | undefined | string | string[] | State<ClassValue>;

  export type ClassInput = ClassInput[] | ClassValue | Promise<ClassValue>;
}
