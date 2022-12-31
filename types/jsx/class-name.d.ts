declare namespace JSX {
  type ClassNamePrimitive = string | string[];
  export type ClassName =
    | ClassName[]
    | Function
    | ClassNamePrimitive
    | Observable<ClassNamePrimitive>
    | Promise<ClassNamePrimitive>;
}
