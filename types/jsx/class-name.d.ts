declare namespace JSX {
  type Lazy<U> = import('../../lib/jsx/context').Lazy<any, U>;

  type ClassValue =
    | Lazy<string | string[]>
    | Expression<string | string[]>
    | string
    | string[];

  export type ClassInput =
    | ClassInput[]
    | ClassValue
    | Observable<ClassValue>
    | Promise<ClassValue>;
}
