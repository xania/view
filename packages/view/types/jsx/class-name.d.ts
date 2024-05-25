declare namespace JSX {
  type ClassValue =
    | null
    | undefined
    | string
    | string[]
    | Signal<string | string[] | null>;

  export type ClassInput = ClassInput[] | ClassValue | Promise<ClassValue>;
}
