declare namespace JSX {
  type ClassValue =
    | null
    | undefined
    | string
    | string[]
    | State<string | string[] | null>;

  export type ClassInput = ClassInput[] | ClassValue | Promise<ClassValue>;
}
