declare module JSX {
  type Element =
    | string
    | number
    | boolean
    | bigint
    | null
    | undefined
    | Node
    | Date
    | Observable<Element>
    | Promise<Element>;
}
